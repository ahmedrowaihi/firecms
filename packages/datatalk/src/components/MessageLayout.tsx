import { AutoAwesomeIcon, Avatar, Menu, MenuItem, PersonIcon } from "@firecms/ui";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, FeedbackSlug } from "../types";
import { SystemMessage } from "./SystemMessage";
import { EntityCollection } from "@firecms/core";

export function MessageLayout({
                                  message,
                                  autoRunCode,
                                  onRemove,
                                  scrollInto,
                                  collections,
                                  onRegenerate,
                                  canRegenerate,
                                  onFeedback
                              }: {
    message?: ChatMessage,
    autoRunCode?: boolean,
    onRemove?: () => void,
    scrollInto?: (ref: React.RefObject<HTMLDivElement>) => void,
    collections?: EntityCollection[],
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void
}) {

    const ref = useRef<HTMLDivElement>(null);
    const scrolled = useRef(false);

    useEffect(() => {
        if (scrolled.current) return;
        scrollInto?.(ref);
        scrolled.current = true;
    }, [scrollInto]);

    const [containerWidth, setContainerWidth] = useState<number | null>(null);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (ref.current) {
                const rect = ref.current?.getBoundingClientRect();
                setContainerWidth(rect.width);
            }
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => resizeObserver.disconnect();
    }, [ref]);

    return <div ref={ref} className="flex flex-col gap-2 bg-white dark:bg-gray-800 dark:bg-opacity-20 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3 justify-center">
            <Menu trigger={<Avatar className="w-10 h-10 shrink-0">
                {message?.user === "USER" ? <PersonIcon/> : <AutoAwesomeIcon/>}
            </Avatar>}>
                <MenuItem dense onClick={onRemove}>Remove</MenuItem>
            </Menu>

            <div className="mt-3 flex-1 text-gray-700 dark:text-gray-200">

                {message
                    ? (message.user === "USER"
                        ? <UserMessage text={message.text}/>
                        : <SystemMessage text={message.text}
                                         loading={message.loading}
                                         autoRunCode={autoRunCode}
                                         scrollInto={() => scrollInto?.(ref)}
                                         collections={collections}
                                         canRegenerate={canRegenerate}
                                         containerWidth={containerWidth ?? undefined}
                                         onRegenerate={onRegenerate}
                                         onFeedback={onFeedback}/>)
                    : null}

            </div>
        </div>
    </div>;
}

function UserMessage({ text }: { text: string }) {
    return <>{text.split("\n").map((line, index) => <p key={index}>{line}</p>)}</>
}
