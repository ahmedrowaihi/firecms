import { useEffect, useRef, useState } from "react";
import { EntityCollection } from "@firecms/core";
import { MarkdownElement, parseMarkdown } from "../utils/parser";
import { CodeBlock } from "./CodeBlock";
import {
    Button,
    CheckIcon,
    CloseIcon,
    ContentCopyIcon,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Label,
    LoopIcon,
    Skeleton,
    TextField,
    ThumbDownOffAltIcon,
    Tooltip
} from "@firecms/ui";
import { FeedbackSlug } from "../types";


export function SystemMessage({
                                  text,
                                  loading,
                                  containerWidth,
                                  scrollInto,
                                  autoRunCode,
                                  collections,
                                  onRegenerate,
                                  canRegenerate,
                                  onFeedback
                              }: {
    text?: string,
    loading?: boolean,
    containerWidth?: number,
    scrollInto: () => void,
    autoRunCode?: boolean,
    collections?: EntityCollection[],
    onRegenerate?: () => void,
    canRegenerate?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedbackMessage?: string) => void
}) {

    const [parsedElements, setParsedElements] = useState<MarkdownElement[] | null>();

    const scrolled = useRef(false);
    useEffect(() => {
        if (scrolled.current) return;
        if (text) {
            const markdownElements = parseMarkdown(text);
            setParsedElements(markdownElements);
            scrollInto();
            scrolled.current = true;
        }
    }, [scrollInto, text]);

    return <>

        {parsedElements && parsedElements.map((element, index) => {
            if (element.type === "html") {
                return <div
                    className={"max-w-full prose dark:prose-invert prose-headings:font-title text-base text-gray-700 dark:text-gray-200"}
                    dangerouslySetInnerHTML={{ __html: element.content }}
                    key={index}/>;
            } else if (element.type === "code") {
                return <CodeBlock key={index}
                                  loading={loading}
                                  autoRunCode={autoRunCode}
                                  initialCode={element.content}
                                  onCodeRun={scrollInto}
                                  collections={collections}
                                  maxWidth={containerWidth ? containerWidth - 90 : undefined}/>;
            } else {
                console.error("Unknown element type", element);
                return null;
            }
        })}

        {loading && <Skeleton className={"max-w-4xl mt-1 mb-4"}/>}

        <div className={"mt-2 flex flex-row gap-1"}>
            {canRegenerate && <Tooltip title={"Regenerate"}>
                <IconButton size={"smallest"} disabled={loading} onClick={onRegenerate}>
                    <LoopIcon size={"smallest"}/>
                </IconButton>
            </Tooltip>}

            <Tooltip title={"Copy"}>
                <MessageCopyIcon text={text ?? ""} disabled={loading}/>
            </Tooltip>

            <BadMessageIcon disabled={loading}
                            onFeedback={onFeedback}/>
        </div>

    </>;
}

function MessageCopyIcon({
                             text,
                             disabled
                         }: {
    text: string,
    disabled?: boolean
}) {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 2000);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [copied]);

    return <IconButton size={"smallest"}
                       disabled={disabled}
                       onClick={() => {
                           setCopied(true);
                           navigator.clipboard.writeText(text);
                       }}>
        {copied ? <CheckIcon size={"smallest"}/> : <ContentCopyIcon size={"smallest"}/>}
    </IconButton>;
}

function BadMessageIcon({
                            disabled,
                            onFeedback
                        }: {
    disabled?: boolean,
    onFeedback?: (reason?: FeedbackSlug, feedback?: string) => void,
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState<FeedbackSlug | null>(null);
    const [feedbackText, setFeedbackText] = useState<string>("");
    return <>

        <Tooltip title={dialogOpen ? undefined : "Bad response"}>
            <IconButton size={"smallest"}
                        disabled={disabled}
                        onClick={() => {
                            setDialogOpen(true);
                        }}>
                <ThumbDownOffAltIcon size={"smallest"}/>
            </IconButton>
        </Tooltip>
        <Dialog
            maxWidth={"xl"}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onOpenAutoFocus={(e) => {
                console.log("onOpenAutoFocus", e);
                e.preventDefault();
            }}>
            <DialogContent className={"flex flex-col gap-4"}>
                What was wrong with the response?
                <div className={"flex flex-row gap-2 flex-wrap"}>
                    <FeedbackLabel title={"Not helpful"}
                                   value={"not_helpful"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Not factually correct"}
                                   value={"not_factually_correct"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Incorrect code"}
                                   value={"incorrect_code"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Unsafe or problematic"}
                                   value={"unsafe_or_problematic"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                    <FeedbackLabel title={"Other"}
                                   value={"other"}
                                   selected={selected}
                                   setSelected={setSelected}/>
                </div>
                <TextField size={"smallest"}
                           value={feedbackText}
                           onChange={(e) => setFeedbackText(e.target.value)}
                           placeholder={"Feel free to add specific details"}></TextField>
            </DialogContent>
            <DialogActions>
                <Button variant={"outlined"}
                        onClick={() => {
                            setDialogOpen(false);
                            onFeedback?.(selected, feedbackText);
                        }}>Submit</Button>
            </DialogActions>

            <IconButton className={"absolute top-4 right-4"}
                        onClick={() => setDialogOpen(false)}>
                <CloseIcon/>
            </IconButton>
        </Dialog>
    </>;
}

function FeedbackLabel({
                           setSelected,
                           title,
                           value,
                           selected
                       }: {
    value: FeedbackSlug,
    title: string,
    selected: FeedbackSlug,
    setSelected: (value: FeedbackSlug | null) => void
}) {
    return <Label border={true}
                  className={value === selected ? "bg-gray-300 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-gray-700" : ""}
                  onClick={() => {
                      setSelected(value);
                  }}>{title}</Label>;
}
