"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Bold,
  ClassicEditor,
  Essentials,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Italic,
  LinkImage,
  Paragraph,
  Plugin,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const UPLOAD_URL = "http://localhost:4000/uploads"; // Adjust as needed if backend URL differs

// 1. Custom Upload Adapter
class MinioUploadAdapter {
  loader: any;
  xhr: XMLHttpRequest | null;

  constructor(loader: any) {
    this.loader = loader;
    this.xhr = null;
  }

  upload() {
    return this.loader.file.then(
      (file: File) =>
        new Promise((resolve, reject) => {
          const xhr = (this.xhr = new XMLHttpRequest());

          xhr.open("POST", UPLOAD_URL, true);
          // xhr.setRequestHeader('Authorization', 'Bearer ...');

          xhr.responseType = "json";
          xhr.addEventListener("error", () => reject("Network error"));
          xhr.addEventListener("abort", () => reject("Upload aborted"));
          xhr.addEventListener("load", () => {
            const response = xhr.response;
            if (!response || response.error) {
              return reject(
                response?.error?.message || "Generic error during upload",
              );
            }
            // Resolve with the backend URL mapped to MinIO
            resolve({
              default: response.url,
            });
          });

          if (xhr.upload) {
            xhr.upload.addEventListener("progress", (evt) => {
              if (evt.lengthComputable) {
                this.loader.uploadTotal = evt.total;
                this.loader.uploaded = evt.loaded;
              }
            });
          }

          const data = new FormData();
          data.append("upload", file);
          xhr.send(data);
        }),
    );
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }
}

// 2. Custom Plugin to bind the adapter
function MinioUploadAdapterPlugin(editor: any) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
    return new MinioUploadAdapter(loader);
  };
}

// 3. Image Deletion Sync Plugin
class ImageSyncPlugin extends Plugin {
  static get pluginName() {
    return "ImageSyncPlugin";
  }

  // Keep track of images currently in the document
  private currentImages: Set<string> = new Set();

  init() {
    const editor = this.editor;
    const document = editor.model.document;

    document.on("change:data", () => {
      // Extract all image URLs currently in the editor
      const root = document.getRoot();
      if (!root) return;

      const newImages = new Set<string>();

      const children = Array.from(root.getChildren()) as unknown as Array<{
        name?: string;
        getAttribute: (key: string) => string | undefined;
      }>;

      for (const element of children) {
        if (element.name === "imageBlock" || element.name === "imageInline") {
          const url = element.getAttribute("src");
          if (url) {
            newImages.add(url);
          }
        }
      }

      // Check for removed images (in currentImages but not in newImages)
      for (const oldUrl of this.currentImages) {
        if (!newImages.has(oldUrl)) {
          // If the old URL was removed, and it points to our MinIO, trigger delete
          if (oldUrl.includes("localhost:9000/blog-bucket")) {
            this.handleImageDeletion(oldUrl);
          }
        }
      }

      // Update our state
      this.currentImages = newImages;
    });
  }

  private handleImageDeletion(url: string) {
    if (typeof window !== "undefined") {
      fetch(UPLOAD_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }), // Send URL in body
      }).catch((err) => {
        console.error("Failed to notify backend of image deletion:", err);
      });
    }
  }
}

interface CustomCKEditorProps {
  data: string;
  onChange: (data: string) => void;
}

export function CustomCKEditor({ data, onChange }: CustomCKEditorProps) {
  return (
    <div className="prose max-w-none">
      <CKEditor
        editor={ClassicEditor}
        data={data}
        onChange={(event, editor) => {
          const content = editor.getData();
          onChange(content);
        }}
        config={{
          plugins: [
            Essentials,
            Bold,
            Italic,
            Paragraph,
            Image,
            ImageUpload,
            ImageToolbar,
            ImageCaption,
            ImageStyle,
            ImageResize,
            LinkImage,
            MinioUploadAdapterPlugin,
            ImageSyncPlugin,
          ],
          toolbar: ["undo", "redo", "|", "bold", "italic", "|", "uploadImage"],
          image: {
            toolbar: [
              "imageStyle:inline",
              "imageStyle:block",
              "imageStyle:side",
              "|",
              "toggleImageCaption",
              "imageTextAlternative",
            ],
          },
        }}
      />
    </div>
  );
}
