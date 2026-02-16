import AddBookmark from "@/components/AddBookmark";
import BookmarkList from "@/components/BookmarkList";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <main className="flex min-h-screen flex-col items-center p-8 sm:p-24 w-full">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
                <h1 className="text-4xl font-bold text-center mb-12">
                    Your Intelligent Bookmarks
                </h1>
                <div className="flex flex-col items-center w-full">
                    <AddBookmark />
                    <div className="w-full mt-8 border-t border-gray-200 dark:border-gray-800" />
                    <BookmarkList initialBookmarks={bookmarks || []} />
                </div>
            </div>
        </main>
    );
}
