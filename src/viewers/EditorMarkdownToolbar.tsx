/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createEffect, createSignal, Show, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Editor } from "@milkdown/kit/core";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import {
    addBlockTypeCommand,
    blockquoteSchema,
    bulletListSchema,
    codeBlockSchema,
    headingSchema,
    hrSchema,
    liftListItemCommand,
    listItemSchema,
    orderedListSchema,
    paragraphSchema,
    selectTextNearPosCommand,
    setBlockTypeCommand,
    wrapInBlockTypeCommand,
} from "@milkdown/kit/preset/commonmark";
import { createTable } from "@milkdown/kit/preset/gfm";
import { listenerCtx } from "@milkdown/kit/plugin/listener";
import { lift } from "@milkdown/kit/prose/commands";
import type { NodeType } from "@milkdown/kit/prose/model";
import type { Selection } from "@milkdown/kit/prose/state";

import type { LucideIcon } from "lucide-solid";
import CodeXml from "lucide-solid/icons/code-xml";
import ImageIcon from "lucide-solid/icons/image";

import List from "lucide-solid/icons/list";
import ListOrdered from "lucide-solid/icons/list-ordered";
import ListTodo from "lucide-solid/icons/list-todo";
import Minus from "lucide-solid/icons/minus";
import Quote from "lucide-solid/icons/quote";
import Sigma from "lucide-solid/icons/sigma";
import Table2 from "lucide-solid/icons/table-2";
import { useI18N } from "../Localization";
import ToolbarView from "./ToolbarView";
import styles from "./EditorMarkdownToolbar.module.css";

type EditorMarkdownToolbarProps = {
    getEditor: () => Editor | null;
};

type ListKind = "bullet" | "ordered" | "task";

type ListContext = {
    itemDepth: number;
    listDepth: number;
    kind: "bullet" | "ordered";
    isTask: boolean;
};

type MarkdownToolbarButtonProps = {
    getEditor: () => Editor | null;
    active?: boolean;
    icon?: LucideIcon;
    text?: string;
    label: string;
    onRun: (ctx: Ctx) => void;
};

function MarkdownToolbarButton(props: MarkdownToolbarButtonProps): JSX.Element {
    return (
        <button
            class={`stdButton small ${props.active ? "active" : ""}`}
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
            <Show when={props.icon}>
                <Dynamic component={props.icon} aria-hidden="true" />
            </Show>
            {props.text}
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

function setCurrentTaskState(ctx: Ctx, checked: boolean | null): void {
    const listContext = getListContext(ctx);
    if (!listContext) {
        return;
    }

    const view = ctx.get(editorViewCtx);
    const { $from } = view.state.selection;
    const item = $from.node(listContext.itemDepth);
    const itemPosition = $from.before(listContext.itemDepth);
    view.dispatch(
        view.state.tr.setNodeMarkup(itemPosition, undefined, {
            ...item.attrs,
            checked,
        })
    );
}

function toggleList(ctx: Ctx, requestedKind: ListKind): void {
    const commands = ctx.get(commandsCtx);
    const listContext = getListContext(ctx);

    if (!listContext) {
        if (requestedKind === "task") {
            commands.call(wrapInBlockTypeCommand.key, {
                nodeType: listItemSchema.type(ctx),
                attrs: { checked: false },
            });
            return;
        }

        commands.call(wrapInBlockTypeCommand.key, {
            nodeType:
                requestedKind === "ordered"
                    ? orderedListSchema.type(ctx)
                    : bulletListSchema.type(ctx),
        });
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
        setCurrentTaskState(ctx, false);
        return;
    }

    if (requestedKind === listContext.kind && !listContext.isTask) {
        commands.call(liftListItemCommand.key);
        return;
    }

    const targetType =
        requestedKind === "ordered" ? orderedListSchema.type(ctx) : bulletListSchema.type(ctx);
    if (requestedKind !== listContext.kind) {
        changeListType(ctx, listContext, targetType);
    }
    if (listContext.isTask) {
        setCurrentTaskState(ctx, null);
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

export function EditorMarkdownToolbar(props: EditorMarkdownToolbarProps): JSX.Element {
    const { t } = useI18N();
    const [activeHeadingLevel, setActiveHeadingLevel] = createSignal(0);

    const updateActiveHeading = (ctx: Ctx): void => {
        setActiveHeadingLevel(getHeadingLevel(ctx));
    };

    createEffect(() => {
        const editor = props.getEditor();
        if (!editor) {
            setActiveHeadingLevel(0);
            return;
        }

        editor.action((ctx) => {
            updateActiveHeading(ctx);
            ctx.get(listenerCtx)
                .selectionUpdated((updatedCtx, selection) => {
                    setActiveHeadingLevel(getHeadingLevel(updatedCtx, selection));
                })
                .updated((updatedCtx) => updateActiveHeading(updatedCtx));
        });
    });

    return (
        <ToolbarView>
            <div class={styles.toolbarGroup} aria-label={t("markdownToolbar.blockStyle")}>
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 0}
                    text={t("markdownToolbar.paragraph")}
                    label={t("markdownToolbar.paragraph")}
                    onRun={(ctx) => {
                        setHeading(ctx, 0);
                        updateActiveHeading(ctx);
                    }}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 1}
                    text="H1"
                    label={t("markdownToolbar.heading1")}
                    onRun={(ctx) => {
                        setHeading(ctx, 1);
                        updateActiveHeading(ctx);
                    }}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 2}
                    text="H2"
                    label={t("markdownToolbar.heading2")}
                    onRun={(ctx) => {
                        setHeading(ctx, 2);
                        updateActiveHeading(ctx);
                    }}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 3}
                    text="H3"
                    label={t("markdownToolbar.heading3")}
                    onRun={(ctx) => {
                        setHeading(ctx, 3);
                        updateActiveHeading(ctx);
                    }}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 4}
                    text="H4"
                    label={t("markdownToolbar.heading4")}
                    onRun={(ctx) => {
                        setHeading(ctx, 4);
                        updateActiveHeading(ctx);
                    }}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 5}
                    text="H5"
                    label={t("markdownToolbar.heading5")}
                    onRun={(ctx) => {
                        setHeading(ctx, 5);
                        updateActiveHeading(ctx);
                    }}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    active={activeHeadingLevel() === 6}
                    text="H6"
                    label={t("markdownToolbar.heading6")}
                    onRun={(ctx) => {
                        setHeading(ctx, 6);
                        updateActiveHeading(ctx);
                    }}
                />
            </div>
            <div class={styles.toolbarDivider} aria-hidden="true" />
            <div class={styles.toolbarGroup} aria-label={t("markdownToolbar.lists")}>
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    icon={List}
                    label={t("markdownToolbar.bulletList")}
                    onRun={(ctx) => toggleList(ctx, "bullet")}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    icon={ListOrdered}
                    label={t("markdownToolbar.orderedList")}
                    onRun={(ctx) => toggleList(ctx, "ordered")}
                />
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    icon={ListTodo}
                    label={t("markdownToolbar.taskList")}
                    onRun={(ctx) => toggleList(ctx, "task")}
                />
            </div>
            <div class={styles.toolbarDivider} aria-hidden="true" />
            <div class={styles.toolbarGroup} aria-label={t("markdownToolbar.insert")}>
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    icon={ImageIcon}
                    label={t("markdownToolbar.image")}
                    onRun={(ctx) => {
                        ctx.get(commandsCtx).call(addBlockTypeCommand.key, {
                            nodeType: imageBlockSchema.type(ctx),
                        });
                    }}
                />
                <MarkdownToolbarButton
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
            </div>
            <div class={styles.toolbarDivider} aria-hidden="true" />
            <div class={styles.toolbarGroup} aria-label={t("markdownToolbar.blocks")}>
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    icon={CodeXml}
                    label={t("markdownToolbar.codeBlock")}
                    onRun={(ctx) => {
                        ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
                            nodeType: codeBlockSchema.type(ctx),
                        });
                    }}
                />
                <MarkdownToolbarButton
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
            </div>
            <div class={styles.toolbarDivider} aria-hidden="true" />
            <div class={styles.toolbarGroup} aria-label={t("markdownToolbar.more")}>
                <MarkdownToolbarButton
                    getEditor={props.getEditor}
                    icon={Quote}
                    label={t("markdownToolbar.quote")}
                    onRun={toggleBlockquote}
                />
                <MarkdownToolbarButton
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
        </ToolbarView>
    );
}

export default EditorMarkdownToolbar;
