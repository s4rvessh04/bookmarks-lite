"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
    query: string;
    onChange: (query: string) => void;
}

export default function SearchBar({ query, onChange }: SearchBarProps) {
    return (
        <div className="relative w-full max-w-5xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search bookmarks by title or URL…"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {query && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-full transition-colors duration-150"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
