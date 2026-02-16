"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { deleteBookmark } from "@/app/actions";
import { Trash2, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Bookmark {
    id: string;
    user_id: string;
    title: string;
    url: string;
    created_at: string;
}

export default function BookmarkList({
    initialBookmarks,
}: {
    initialBookmarks: Bookmark[];
}) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const supabase = createClient();

    useEffect(() => {
        setBookmarks(initialBookmarks);
    }, [initialBookmarks]);

    useEffect(() => {
        const channel = supabase
            .channel("realtime bookmarks")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bookmarks",
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
                    } else if (payload.eventType === "DELETE") {
                        setBookmarks((prev) =>
                            prev.filter((bookmark) => bookmark.id !== payload.old.id)
                        );
                    } else if (payload.eventType === "UPDATE") {
                        setBookmarks((prev) =>
                            prev.map((bookmark) =>
                                bookmark.id === payload.new.id
                                    ? (payload.new as Bookmark)
                                    : bookmark
                            )
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handleDelete = async (id: string) => {
        // Optimistic update
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
        await deleteBookmark(id);
    };

    if (bookmarks.length === 0) {
        return (
            <div className="text-center p-10 text-muted-foreground animate-in fade-in zoom-in duration-500">
                No bookmarks yet. Add one above!
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <AnimatePresence mode="popLayout">
                {bookmarks.map((bookmark) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        key={bookmark.id}
                        className="group relative rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-200"
                    >
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold leading-none tracking-tight truncate pr-8">
                                    {bookmark.title}
                                </h3>
                            </div>
                            <a
                                href={bookmark.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground truncate hover:underline flex items-center gap-1 mt-1"
                            >
                                {bookmark.url} <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>

                        <button
                            onClick={() => handleDelete(bookmark.id)}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                            aria-label="Delete bookmark"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
