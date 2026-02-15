"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface SuggestionItem {
  id: number;
  title: string;
  slug: string;
  snippet: string;
  publishedOn: string;
}

interface PostSearchBoxProps {
  initialQuery?: string;
  basePath: string;
  placeholder?: string;
  className?: string;
  navigateSuggestionsToPost?: boolean;
  postPathPrefix?: string;
}

export function PostSearchBox({
  initialQuery = "",
  basePath,
  placeholder = "Search posts...",
  className,
  navigateSuggestionsToPost = false,
  postPathPrefix = "/posts",
}: PostSearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          q: trimmed,
          limit: "6",
        });
        const response = await fetch(
          `/api/posts/suggestions?${params.toString()}`,
          {
            signal: abortController.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }

        const data = (await response.json()) as SuggestionItem[];
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
        setSuggestions([]);
        setOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function runSearch(rawQuery: string) {
    const nextQuery = rawQuery.trim();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (nextQuery) {
      params.set("search", nextQuery);
    } else {
      params.delete("search");
    }

    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleSuggestionSelect(item: SuggestionItem) {
    if (navigateSuggestionsToPost) {
      router.push(`${postPathPrefix}/${item.slug}`);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    setQuery(item.title);
    runSearch(item.title);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter") {
        runSearch(query);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((previous) =>
        previous < suggestions.length - 1 ? previous + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((previous) =>
        previous > 0 ? previous - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0) {
        handleSuggestionSelect(suggestions[activeIndex]);
      } else {
        runSearch(query);
      }
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form className="flex w-full gap-2" onSubmit={onSubmit}>
        <div className="relative flex-1">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setOpen(true);
              }
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Search posts"
            autoComplete="off"
          />
          {isLoading ? (
            <Loader2 className="text-muted-foreground absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
          ) : (
            <Search className="text-muted-foreground absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" />
          )}
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {open ? (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-2 w-full overflow-hidden rounded-md border shadow-lg">
          <button
            type="button"
            className="hover:bg-muted flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm font-medium"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runSearch(query)}
          >
            <Search className="h-4 w-4" />
            Search for "{query.trim()}"
          </button>
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "hover:bg-muted w-full px-3 py-2 text-left transition-colors",
                    activeIndex === index ? "bg-muted" : "",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionSelect(item)}
                >
                  <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                  {item.snippet ? (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {item.snippet}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
