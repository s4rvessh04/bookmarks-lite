import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Bookmark } from "lucide-react";

export default async function Navbar() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const signOut = async () => {
        "use server";
        const supabase = createClient();
        await supabase.auth.signOut();
        return redirect("/login");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
                <Link href="/" className="flex items-center space-x-2">
                    <Bookmark className="h-6 w-6" />
                    <span className="font-bold inline-block">Bookmarks Lite</span>
                </Link>

                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden sm:inline-block">
                            {user.email}
                        </span>
                        <form action={signOut}>
                            <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 px-3"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </form>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
