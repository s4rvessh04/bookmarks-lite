"use client";

import { useFormStatus } from "react-dom";
import { addBookmark } from "@/app/actions";
import { useRef } from "react";
import { Plus } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
            {pending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-foreground" />
            ) : (
                <>
                    <Plus className="mr-2 h-4 w-4" /> Add
                </>
            )}
        </button>
    );
}

export default function AddBookmark() {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await addBookmark(formData);
                formRef.current?.reset();
            }}
            className="flex w-full max-w-sm items-center space-x-2 my-8"
        >
            <div className="grid w-full gap-2">
                <input
                    name="title"
                    placeholder="Title"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                    name="url"
                    placeholder="URL"
                    required
                    type="url"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <div className="flex flex-col justify-end h-full pt-1">
                <SubmitButton />
            </div>
        </form>
    );
}
