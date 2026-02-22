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

const UPLOAD_URL = "http://localhost:4000/uploads";

// Custom events dispatched on window so the form can react to upload lifecycle.
const UPLOAD_START_EVENT = "ckeditor:upload:start";
const UPLOAD_END_EVENT = "ckeditor:upload:end";

// 1. Custom Upload Adapter
class MinioUploadAdapter {
  loader: any;
  xhr: XMLHttpRequest | null;

  constructor(loader: any) {
    this.loader = loader;
    this.xhr = null;
  }

  upload() {
    // Notify the form that an upload is in progress so it can disable the
    // save button and avoid saving incomplete content.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UPLOAD_START_EVENT));
    }

    return this.loader.file.then(
      (file: File) =>
        new Promise((resolve, reject) => {
          const dispatchEnd = () => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent(UPLOAD_END_EVENT));
            }
          };

          const xhr = (this.xhr = new XMLHttpRequest());
          xhr.open("POST", UPLOAD_URL, true);
          xhr.responseType = "json";

          xhr.addEventListener("error", () => {
            dispatchEnd();
            reject("Network error");
          });
          xhr.addEventListener("abort", () => {
            dispatchEnd();
            reject("Upload aborted");
          });
          xhr.addEventListener("load", () => {
            dispatchEnd();
            const response = xhr.response;
            if (!response || response.error) {
              return reject(
                response?.error?.message || "Generic error during upload",
              );
            }
            // The global ResponseInterceptor wraps every NestJS response in
            // { data: { url: "..." }, success, statusCode, … }.
            // Fall back to response.url for any future endpoint that returns
            // the URL directly without the envelope.
            const imageUrl =
              response?.data?.url ?? response?.url ?? response?.data;
            if (!imageUrl) {
              return reject("Upload failed: server returned no image URL");
            }
            resolve({ default: imageUrl });
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(UPLOAD_END_EVENT));
      }
      this.xhr.abort();
    }
  }
}

// 2. Plugin to bind the adapter
function MinioUploadAdapterPlugin(editor: any) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
    return new MinioUploadAdapter(loader);
  };
}

// 3. Image Deletion Sync Plugin
//    Watches document changes and deletes MinIO files when images are removed
//    from the editor.
class ImageSyncPlugin extends Plugin {
  static get pluginName() {
    return "ImageSyncPlugin";
  }

  private currentImages: Set<string> = new Set();

  init() {
    const editor = this.editor;
    const document = editor.model.document;

    document.on("change:data", () => {
      const root = document.getRoot();
      if (!root) return;

      const newImages = new Set<string>();
      // Recursively walk every node in the document model so that inline
      // images (inside paragraphs, table cells, etc.) are also tracked.
      this._collectImageSrcs(root, newImages);

      for (const oldUrl of this.currentImages) {
        if (
          !newImages.has(oldUrl) &&
          oldUrl.includes("localhost:9000/blog-bucket")
        ) {
          this.handleImageDeletion(oldUrl);
        }
      }

      this.currentImages = newImages;
    });
  }

  /**
   * Recursively collect all image src values from the model subtree.
   * Skips blob: URLs (images still uploading) to avoid false positives.
   */
  private _collectImageSrcs(node: any, result: Set<string>) {
    if (typeof node.getChildren !== "function") return;
    for (const child of node.getChildren()) {
      if (child.name === "imageBlock" || child.name === "imageInline") {
        const url = child.getAttribute("src");
        if (url && typeof url === "string" && !url.startsWith("blob:")) {
          result.add(url);
        }
      }
      // Recurse into any element (paragraph, tableCell, blockQuote …)
      this._collectImageSrcs(child, result);
    }
  }

  private handleImageDeletion(url: string) {
    if (typeof window !== "undefined") {
      fetch(UPLOAD_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).catch((err) => {
        console.error("Failed to notify backend of image deletion:", err);
      });
    }
  }
}

interface CustomCKEditorProps {
  data: string;
  onChange: (data: string) => void;
  /** Called once the editor instance is ready. Use this ref to call
   *  getData() programmatically (e.g. on form submit). */
  onReady?: (editor: any) => void;
}

export function CustomCKEditor({
  data,
  onChange,
  onReady,
}: CustomCKEditorProps) {
  return (
    <div className="prose max-w-none">
      <CKEditor
        editor={ClassicEditor}
        data={data}
        onReady={(editor) => {
          onReady?.(editor);
        }}
        onChange={(_event, editor) => {
          onChange(editor.getData());
        }}
        config={{
          licenseKey: "GPL",
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
