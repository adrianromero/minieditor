/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createEffect, createSignal, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Editor } from "@milkdown/kit/core";
import { commandsCtx, editorViewCtx, schemaCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import { toggleLinkCommand } from "@milkdown/kit/component/link-tooltip";
import {
    addBlockTypeCommand,
    blockquoteSchema,
    bulletListSchema,
    codeBlockSchema,
    emphasisSchema,
    headingSchema,
    hrSchema,
    inlineCodeSchema,
    liftListItemCommand,
    linkSchema,
    listItemSchema,
    orderedListSchema,
    paragraphSchema,
    selectTextNearPosCommand,
    setBlockTypeCommand,
    strongSchema,
    toggleEmphasisCommand,
    toggleInlineCodeCommand,
    toggleStrongCommand,
    wrapInBlockTypeCommand,
} from "@milkdown/kit/preset/commonmark";
import {
    createTable,
    strikethroughSchema,
    toggleStrikethroughCommand,
} from "@milkdown/kit/preset/gfm";
import { listenerCtx } from "@milkdown/kit/plugin/listener";
import { lift } from "@milkdown/kit/prose/commands";
import type { MarkType, Node as ProseMirrorNode, NodeType } from "@milkdown/kit/prose/model";
import { liftListItem, wrapInList } from "@milkdown/kit/prose/schema-list";
import {
    NodeSelection,
    TextSelection,
    type Selection,
    type Transaction,
} from "@milkdown/kit/prose/state";

import type { LucideIcon } from "lucide-solid";
import Bold from "lucide-solid/icons/bold";
import Code from "lucide-solid/icons/code";
import CodeXml from "lucide-solid/icons/code-xml";
import Heading1 from "lucide-solid/icons/heading-1";
import Heading2 from "lucide-solid/icons/heading-2";
import Heading3 from "lucide-solid/icons/heading-3";
import Heading4 from "lucide-solid/icons/heading-4";
import Heading5 from "lucide-solid/icons/heading-5";
import Heading6 from "lucide-solid/icons/heading-6";
import ImageIcon from "lucide-solid/icons/image";
import Italic from "lucide-solid/icons/italic";
import LinkIcon from "lucide-solid/icons/link";

import List from "lucide-solid/icons/list";
import ListOrdered from "lucide-solid/icons/list-ordered";
import ListTodo from "lucide-solid/icons/list-todo";
import Minus from "lucide-solid/icons/minus";
import Pilcrow from "lucide-solid/icons/pilcrow";
import Quote from "lucide-solid/icons/quote";
import Sigma from "lucide-solid/icons/sigma";
import SquareFunction from "lucide-solid/icons/square-function";
import Strikethrough from "lucide-solid/icons/strikethrough";
import Table2 from "lucide-solid/icons/table-2";
import { useI18N } from "../Localization";
import Sidebar from "../commons/Sidebar";
import styles from "./EditorMarkdownSidebar.module.css";

type EditorMarkdownSidebarProps = {
    getEditor: () => Editor | null;
};

type ListKind = "bullet" | "ordered" | "task";

type ListContext = {
    itemDepth: number;
    listDepth: number;
    kind: "bullet" | "ordered";
    isTask: boolean;
};

type InlineStyleState = {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    code: boolean;
    math: boolean;
    link: boolean;
};

const EMPTY_INLINE_STYLE_STATE: InlineStyleState = {
    bold: false,
    italic: false,
    strikethrough: false,
    code: false,
    math: false,
    link: false,
};

type SidebarButtonProps = {
    getEditor: () => Editor | null;
    active?: boolean;
    icon: LucideIcon;
    label: string;
    onRun: (ctx: Ctx) => void;
};

function SidebarButton(props: SidebarButtonProps): JSX.Element {
    return (
        <button
            class={`stdButton toolbar ${props.active ? "selected" : ""}`}
            type="button"
            aria-label={props.label}
            title={props.label}
            disabled={!props.getEditor()}
            onPointerDown={(event) => {
                event.preventDefault();
                const editor = props.getEditor();
                if (!editor) {
                    return;
                }

                editor.action((ctx) => {
                    props.onRun(ctx);
                    ctx.get(editorViewCtx).focus();
                });
            }}
        >
            <Dynamic component={props.icon} aria-hidden="true" />
            {props.label}
        </button>
    );
}

type SidebarIconButtonProps = {
    getEditor: () => Editor | null;
    active?: boolean;
    icon: LucideIcon;
    label: string;
    onRun: (ctx: Ctx) => void;
};

function SidebarIconButton(props: SidebarIconButtonProps): JSX.Element {
    return (
        <button
            class={`stdButton toolbar ${props.active ? "selected" : ""}`}
            type="button"
            aria-label={props.label}
            title={props.label}
            disabled={!props.getEditor()}
            onPointerDown={(event) => {
                event.preventDefault();
                const editor = props.getEditor();
                if (!editor) {
                    return;
                }

                editor.action((ctx) => {
                    props.onRun(ctx);
                    ctx.get(editorViewCtx).focus();
                });
            }}
        >
            <Dynamic component={props.icon} aria-hidden="true" />
        </button>
    );
}

function setHeading(ctx: Ctx, level: number): void {
    const commands = ctx.get(commandsCtx);
    if (level === 0) {
        commands.call(setBlockTypeCommand.key, { nodeType: paragraphSchema.type(ctx) });
        return;
    }

    commands.call(setBlockTypeCommand.key, {
        nodeType: headingSchema.type(ctx),
        attrs: { level },
    });
}

function getHeadingLevel(ctx: Ctx, selection?: Selection): number {
    const currentSelection = selection ?? ctx.get(editorViewCtx).state.selection;
    const node = currentSelection.$from.parent;

    return node.type === headingSchema.type(ctx) ? (node.attrs.level as number) : 0;
}

function isMarkActive(ctx: Ctx, markType: MarkType, selection?: Selection): boolean {
    const state = ctx.get(editorViewCtx).state;
    const currentSelection = selection ?? state.selection;

    if (!currentSelection.empty) {
        return state.doc.rangeHasMark(currentSelection.from, currentSelection.to, markType);
    }

    if (state.storedMarks?.some((mark) => mark.type === markType)) {
        return true;
    }

    return (
        currentSelection instanceof TextSelection &&
        Boolean(currentSelection.$cursor?.marks().some((mark) => mark.type === markType))
    );
}

function getInlineStyleState(ctx: Ctx, selection?: Selection): InlineStyleState {
    const currentSelection = selection ?? ctx.get(editorViewCtx).state.selection;
    const mathInline = ctx.get(schemaCtx).nodes.math_inline;

    return {
        bold: isMarkActive(ctx, strongSchema.type(ctx), currentSelection),
        italic: isMarkActive(ctx, emphasisSchema.type(ctx), currentSelection),
        strikethrough: isMarkActive(ctx, strikethroughSchema.type(ctx), currentSelection),
        code: isMarkActive(ctx, inlineCodeSchema.type(ctx), currentSelection),
        math:
            Boolean(mathInline) &&
            currentSelection instanceof NodeSelection &&
            currentSelection.node.type === mathInline,
        link: isMarkActive(ctx, linkSchema.type(ctx), currentSelection),
    };
}

function toggleInlineCode(ctx: Ctx): void {
    const view = ctx.get(editorViewCtx);
    const { state } = view;

    if (!state.selection.empty) {
        ctx.get(commandsCtx).call(toggleInlineCodeCommand.key);
        return;
    }

    const markType = inlineCodeSchema.type(ctx);
    view.dispatch(
        isMarkActive(ctx, markType)
            ? state.tr.removeStoredMark(markType)
            : state.tr.addStoredMark(markType.create())
    );
}

function toggleLink(ctx: Ctx): void {
    const view = ctx.get(editorViewCtx);
    const markType = linkSchema.type(ctx);

    if (view.state.selection.empty && isMarkActive(ctx, markType)) {
        view.dispatch(view.state.tr.removeStoredMark(markType));
        return;
    }

    ctx.get(commandsCtx).call(toggleLinkCommand.key);
}

function getListContext(ctx: Ctx): ListContext | null {
    const view = ctx.get(editorViewCtx);
    const { $from } = view.state.selection;
    const listItem = listItemSchema.type(ctx);
    const bulletList = bulletListSchema.type(ctx);
    const orderedList = orderedListSchema.type(ctx);
    let itemDepth: number | null = null;

    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (itemDepth === null && node.type === listItem) {
            itemDepth = depth;
            continue;
        }

        if (itemDepth !== null && (node.type === bulletList || node.type === orderedList)) {
            return {
                itemDepth,
                listDepth: depth,
                kind: node.type === orderedList ? "ordered" : "bullet",
                isTask: $from.node(itemDepth).attrs.checked !== null,
            };
        }
    }

    return null;
}

function changeListType(ctx: Ctx, listContext: ListContext, nodeType: NodeType): void {
    const view = ctx.get(editorViewCtx);
    const { $from } = view.state.selection;
    const currentList = $from.node(listContext.listDepth);
    const listPosition = $from.before(listContext.listDepth);
    const attrs =
        nodeType === orderedListSchema.type(ctx)
            ? { order: 1, spread: currentList.attrs.spread }
            : { spread: currentList.attrs.spread };

    view.dispatch(view.state.tr.setNodeMarkup(listPosition, nodeType, attrs));
}

function applySelectedTaskState(
    transaction: Transaction,
    listItem: NodeType,
    checked: boolean | null
): void {
    const { from, to } = transaction.selection;
    transaction.doc.nodesBetween(from, to, (node, position) => {
        if (node.type === listItem) {
            transaction.setNodeMarkup(position, undefined, {
                ...node.attrs,
                checked,
            });
        }
    });
}

function setSelectedTaskState(ctx: Ctx, checked: boolean | null): void {
    const view = ctx.get(editorViewCtx);
    const transaction = view.state.tr;
    applySelectedTaskState(transaction, listItemSchema.type(ctx), checked);

    if (transaction.docChanged) {
        view.dispatch(transaction);
    }
}

type ListRange = {
    node: ProseMirrorNode;
    position: number;
};

function getTextBounds(node: ProseMirrorNode, position: number): [number, number] | null {
    let first: number | null = null;
    let last: number | null = null;

    node.descendants((child, relativePosition) => {
        if (!child.isText) {
            return;
        }

        const textPosition = position + 1 + relativePosition;
        first ??= textPosition;
        last = textPosition + child.nodeSize;
    });

    return first === null || last === null ? null : [first, last];
}

function liftSelectedListItems(ctx: Ctx, listType: NodeType): void {
    const view = ctx.get(editorViewCtx);
    const listItem = listItemSchema.type(ctx);
    const { from, to } = view.state.selection;
    const lists: ListRange[] = [];

    view.state.doc.nodesBetween(from, to, (node, position) => {
        if (node.type === listType) {
            lists.push({ node, position });
            return false;
        }
    });

    if (lists.length <= 1) {
        ctx.get(commandsCtx).call(liftListItemCommand.key);
        return;
    }

    let anchor = view.state.selection.anchor;
    let head = view.state.selection.head;

    for (const { node, position } of lists.reverse()) {
        const bounds = getTextBounds(node, position);
        if (!bounds) {
            continue;
        }

        const selectionFrom = Math.max(Math.min(anchor, head), bounds[0]);
        const selectionTo = Math.min(Math.max(anchor, head), bounds[1]);
        const state = view.state.apply(
            view.state.tr.setSelection(
                TextSelection.create(view.state.doc, selectionFrom, selectionTo)
            )
        );

        liftListItem(listItem)(state, (transaction) => {
            anchor = transaction.mapping.map(anchor);
            head = transaction.mapping.map(head);
            transaction.setSelection(TextSelection.create(transaction.doc, anchor, head));
            view.dispatch(transaction);
        });
    }
}

export function toggleList(ctx: Ctx, requestedKind: ListKind): void {
    const commands = ctx.get(commandsCtx);
    const listContext = getListContext(ctx);

    if (!listContext) {
        if (requestedKind === "task") {
            const view = ctx.get(editorViewCtx);
            wrapInList(bulletListSchema.type(ctx), { spread: true })(view.state, (transaction) => {
                applySelectedTaskState(transaction, listItemSchema.type(ctx), false);
                view.dispatch(transaction);
            });
            return;
        }

        const view = ctx.get(editorViewCtx);
        const listType =
            requestedKind === "ordered" ? orderedListSchema.type(ctx) : bulletListSchema.type(ctx);
        wrapInList(listType, { spread: true })(view.state, (transaction) =>
            view.dispatch(transaction)
        );
        return;
    }

    if (requestedKind === "task") {
        if (listContext.kind === "bullet" && listContext.isTask) {
            commands.call(liftListItemCommand.key);
            return;
        }

        if (listContext.kind === "ordered") {
            changeListType(ctx, listContext, bulletListSchema.type(ctx));
        }
        setSelectedTaskState(ctx, false);
        return;
    }

    if (requestedKind === listContext.kind && !listContext.isTask) {
        liftSelectedListItems(
            ctx,
            requestedKind === "ordered" ? orderedListSchema.type(ctx) : bulletListSchema.type(ctx)
        );
        return;
    }

    const targetType =
        requestedKind === "ordered" ? orderedListSchema.type(ctx) : bulletListSchema.type(ctx);
    if (requestedKind !== listContext.kind) {
        changeListType(ctx, listContext, targetType);
    }
    if (listContext.isTask) {
        setSelectedTaskState(ctx, null);
    }
}

function toggleBlockquote(ctx: Ctx): void {
    const view = ctx.get(editorViewCtx);
    const blockquote = blockquoteSchema.type(ctx);
    const { $from } = view.state.selection;

    for (let depth = $from.depth; depth > 0; depth--) {
        if ($from.node(depth).type === blockquote) {
            lift(view.state, (transaction) => view.dispatch(transaction));
            return;
        }
    }

    ctx.get(commandsCtx).call(wrapInBlockTypeCommand.key, {
        nodeType: blockquote,
    });
}

export function EditorMarkdownSidebar(props: EditorMarkdownSidebarProps): JSX.Element {
    const { t } = useI18N();
    const [activeHeadingLevel, setActiveHeadingLevel] = createSignal(0);
    const [activeInlineStyles, setActiveInlineStyles] =
        createSignal<InlineStyleState>(EMPTY_INLINE_STYLE_STATE);

    const updateActiveState = (ctx: Ctx, selection?: Selection): void => {
        setActiveHeadingLevel(getHeadingLevel(ctx, selection));
        setActiveInlineStyles(getInlineStyleState(ctx, selection));
    };

    createEffect(() => {
        const editor = props.getEditor();
        if (!editor) {
            setActiveHeadingLevel(0);
            setActiveInlineStyles(EMPTY_INLINE_STYLE_STATE);
            return;
        }

        editor.action((ctx) => {
            updateActiveState(ctx);
            ctx.get(listenerCtx)
                .selectionUpdated((updatedCtx, selection) => {
                    updateActiveState(updatedCtx, selection);
                })
                .updated((updatedCtx) => updateActiveState(updatedCtx));
        });
    });

    return (
        <Sidebar>
            <div class={styles.panel}>
                <section class={styles.section}>
                    <h2 class={styles.sectionTitle}>{t("markdownToolbar.blockStyle")}</h2>
                    <div class={styles.buttonGridLarge}>
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeHeadingLevel() === 1}
                            icon={Heading1}
                            label={t("markdownToolbar.heading1")}
                            onRun={(ctx) => {
                                setHeading(ctx, 1);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeHeadingLevel() === 2}
                            icon={Heading2}
                            label={t("markdownToolbar.heading2")}
                            onRun={(ctx) => {
                                setHeading(ctx, 2);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeHeadingLevel() === 3}
                            icon={Heading3}
                            label={t("markdownToolbar.heading3")}
                            onRun={(ctx) => {
                                setHeading(ctx, 3);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeHeadingLevel() === 4}
                            icon={Heading4}
                            label={t("markdownToolbar.heading4")}
                            onRun={(ctx) => {
                                setHeading(ctx, 4);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeHeadingLevel() === 5}
                            icon={Heading5}
                            label={t("markdownToolbar.heading5")}
                            onRun={(ctx) => {
                                setHeading(ctx, 5);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeHeadingLevel() === 6}
                            icon={Heading6}
                            label={t("markdownToolbar.heading6")}
                            onRun={(ctx) => {
                                setHeading(ctx, 6);
                                updateActiveState(ctx);
                            }}
                        />
                    </div>
                    <SidebarButton
                        getEditor={props.getEditor}
                        active={activeHeadingLevel() === 0}
                        icon={Pilcrow}
                        label={t("markdownToolbar.paragraph")}
                        onRun={(ctx) => {
                            setHeading(ctx, 0);
                            updateActiveState(ctx);
                        }}
                    />

                    <div class={styles.buttonGrid}>
                        <SidebarButton
                            getEditor={props.getEditor}
                            icon={Quote}
                            label={t("markdownToolbar.quote")}
                            onRun={toggleBlockquote}
                        />
                        <SidebarButton
                            getEditor={props.getEditor}
                            icon={Minus}
                            label={t("markdownToolbar.divider")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(addBlockTypeCommand.key, {
                                    nodeType: hrSchema.type(ctx),
                                });
                            }}
                        />
                    </div>
                </section>

                <section class={styles.section}>
                    <h2 class={styles.sectionTitle}>{t("markdownToolbar.formatting")}</h2>
                    <div class={styles.buttonGridLarge}>
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeInlineStyles().bold}
                            icon={Bold}
                            label={t("markdownToolbar.bold")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(toggleStrongCommand.key);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeInlineStyles().italic}
                            icon={Italic}
                            label={t("markdownToolbar.italic")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(toggleEmphasisCommand.key);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeInlineStyles().strikethrough}
                            icon={Strikethrough}
                            label={t("markdownToolbar.strikethrough")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(toggleStrikethroughCommand.key);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeInlineStyles().link}
                            icon={LinkIcon}
                            label={t("markdownToolbar.link")}
                            onRun={(ctx) => {
                                toggleLink(ctx);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeInlineStyles().code}
                            icon={Code}
                            label={t("markdownToolbar.inlineCode")}
                            onRun={(ctx) => {
                                toggleInlineCode(ctx);
                                updateActiveState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            active={activeInlineStyles().math}
                            icon={SquareFunction}
                            label={t("markdownToolbar.inlineMath")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call("ToggleLatex");
                                updateActiveState(ctx);
                            }}
                        />
                    </div>
                </section>
                <section class={styles.section}>
                    <h2 class={styles.sectionTitle}>{t("markdownToolbar.lists")}</h2>

                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={List}
                        label={t("markdownToolbar.bulletList")}
                        onRun={(ctx) => toggleList(ctx, "bullet")}
                    />
                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={ListOrdered}
                        label={t("markdownToolbar.orderedList")}
                        onRun={(ctx) => toggleList(ctx, "ordered")}
                    />
                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={ListTodo}
                        label={t("markdownToolbar.taskList")}
                        onRun={(ctx) => toggleList(ctx, "task")}
                    />
                </section>
                <section class={styles.section}>
                    <h2 class={styles.sectionTitle}>{t("markdownToolbar.blocks")}</h2>

                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={ImageIcon}
                        label={t("markdownToolbar.image")}
                        onRun={(ctx) => {
                            ctx.get(commandsCtx).call(addBlockTypeCommand.key, {
                                nodeType: imageBlockSchema.type(ctx),
                            });
                        }}
                    />
                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={Table2}
                        label={t("markdownToolbar.table")}
                        onRun={(ctx) => {
                            const commands = ctx.get(commandsCtx);
                            const { from } = ctx.get(editorViewCtx).state.selection;
                            commands.call(addBlockTypeCommand.key, {
                                nodeType: createTable(ctx, 3, 3),
                            });
                            commands.call(selectTextNearPosCommand.key, { pos: from });
                        }}
                    />

                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={CodeXml}
                        label={t("markdownToolbar.codeBlock")}
                        onRun={(ctx) => {
                            ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
                                nodeType: codeBlockSchema.type(ctx),
                            });
                        }}
                    />
                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={Sigma}
                        label={t("markdownToolbar.mathBlock")}
                        onRun={(ctx) => {
                            ctx.get(commandsCtx).call(addBlockTypeCommand.key, {
                                nodeType: codeBlockSchema.type(ctx),
                                attrs: { language: "LaTeX" },
                            });
                        }}
                    />
                </section>
            </div>
        </Sidebar>
    );
}

export default EditorMarkdownSidebar;
