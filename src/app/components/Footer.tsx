"use client";

export default function Footer() {
    return (
        <footer className="w-full bg-muted px-4 py-6 border-t text-sm text-muted-foreground">
            <div className="max-w-5xl mx-auto flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                <p className="text-center md:text-left leading-snug">
                    DISCLAIMER: The information contained on the{" "}
                    <span className="font-semibold">MLB Analytics</span> website (the &quote;Service&quote;) is for
                    entertainment purposes only. The contents of the Service are not intended to be, and shall not be
                    construed as, gambling, financial advice, or any other professional advice or service.
                    MLB Analytics and its owners (collectively, the &quote;Company&quote;) assume no responsibility
                    for errors or omissions in the contents of the Service.
                </p>
            </div>
        </footer>
    );
}
