/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Editor } from "@milkdown/kit/core";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";
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
    insertImageCommand,
    liftListItemCommand,
    linkSchema,
    listItemSchema,
    orderedListSchema,
    paragraphSchema,
    selectTextNearPosCommand,
    setBlockTypeCommand,
    sinkListItemCommand,
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
import { lift } from "@milkdown/kit/prose/commands";
import type { MarkType, Node as ProseMirrorNode, NodeType } from "@milkdown/kit/prose/model";
import { liftListItem, wrapInList } from "@milkdown/kit/prose/schema-list";
import { Plugin, TextSelection, type Selection, type Transaction } from "@milkdown/kit/prose/state";

import { type LucideIcon } from "lucide-solid";
import Bold from "lucide-solid/icons/bold";
import Code from "lucide-solid/icons/code";
import FileCog from "lucide-solid/icons/file-cog";
import Heading1 from "lucide-solid/icons/heading-1";
import Heading2 from "lucide-solid/icons/heading-2";
import Heading3 from "lucide-solid/icons/heading-3";
import Heading4 from "lucide-solid/icons/heading-4";
import Heading5 from "lucide-solid/icons/heading-5";
import Heading6 from "lucide-solid/icons/heading-6";
import ImageIcon from "lucide-solid/icons/image";
import IndentDecrease from "lucide-solid/icons/indent-decrease";
import IndentIncrease from "lucide-solid/icons/indent-increase";
import Italic from "lucide-solid/icons/italic";
import Link2 from "lucide-solid/icons/link-2";

import List from "lucide-solid/icons/list";
import ListOrdered from "lucide-solid/icons/list-ordered";
import ListTodo from "lucide-solid/icons/list-todo";
import Minus from "lucide-solid/icons/minus";
import TextAlignStart from "lucide-solid/icons/text-align-start";
import Quote from "lucide-solid/icons/quote";
import Sigma from "lucide-solid/icons/sigma";
import SquareCode from "lucide-solid/icons/square-code";
import SquareSigma from "lucide-solid/icons/square-sigma";
import Strikethrough from "lucide-solid/icons/strikethrough";
import Table2 from "lucide-solid/icons/table-2";
import { useI18N } from "../Localization";
import AppSidebar from "../commons/AppSidebar";
import { useSidebarDisabled } from "../commons/Sidebar";
import SidebarTab from "../commons/SidebarTab";
import SidebarTabSection from "../commons/SidebarTabSection";
import SearchPanel from "../commons/SearchPanel";
import type { SearchController } from "../search/SearchController";

type EditorMarkdownSidebarProps = {
    getEditor: () => Editor | null;
    disabled?: boolean;
    frontmatterVisible: boolean;
    onToggleFrontmatter: () => void;
    searchController: SearchController | null;
    selectedTab: string;
    onSelectedTabChange: (key: string) => void;
    registerSearchFocus?: (focus: (() => void) | null) => void;
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
    selected?: boolean;
    focusEditorAfterRun?: boolean;
    icon: LucideIcon;
    label: string;
    onRun: (ctx: Ctx) => void;
};

function SidebarButton(props: SidebarButtonProps): JSX.Element {
    const sidebarDisabled = useSidebarDisabled();
    const selected = (): boolean => Boolean(props.selected) && !sidebarDisabled();

    return (
        <button
            class={`stdButton toolbar ${selected() ? "selected" : ""}`}
            type="button"
            aria-label={props.label}
            title={props.label}
            disabled={sidebarDisabled() || !props.getEditor()}
            onPointerDown={(event) => {
                event.preventDefault();
                const editor = props.getEditor();
                if (!editor) {
                    return;
                }

                editor.action((ctx) => {
                    props.onRun(ctx);
                    if (props.focusEditorAfterRun !== false) {
                        ctx.get(editorViewCtx).focus();
                    }
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
    selected?: boolean;
    icon: LucideIcon;
    label: string;
    onRun: (ctx: Ctx) => void;
};

function SidebarIconButton(props: SidebarIconButtonProps): JSX.Element {
    const sidebarDisabled = useSidebarDisabled();
    const selected = (): boolean => Boolean(props.selected) && !sidebarDisabled();

    return (
        <button
            class={`stdButton toolbar ${selected() ? "selected" : ""}`}
            type="button"
            aria-label={props.label}
            title={props.label}
            disabled={sidebarDisabled() || !props.getEditor()}
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

function isTypingMarkActive(ctx: Ctx, markType: MarkType, selection?: Selection): boolean {
    const state = ctx.get(editorViewCtx).state;
    const currentSelection = selection ?? state.selection;
    const marks =
        state.storedMarks ??
        (currentSelection.empty
            ? currentSelection.$from.marks()
            : currentSelection.$from.marksAcross(currentSelection.$to)) ??
        [];

    return marks.some((mark) => mark.type === markType);
}

export function getInlineStyleState(ctx: Ctx, selection?: Selection): InlineStyleState {
    const currentSelection = selection ?? ctx.get(editorViewCtx).state.selection;

    return {
        bold: isTypingMarkActive(ctx, strongSchema.type(ctx), currentSelection),
        italic: isTypingMarkActive(ctx, emphasisSchema.type(ctx), currentSelection),
        strikethrough: isTypingMarkActive(ctx, strikethroughSchema.type(ctx), currentSelection),
        code: isTypingMarkActive(ctx, inlineCodeSchema.type(ctx), currentSelection),
        // Inline math is an atomic node, not a mark that can be pending for the next input.
        math: false,
        link: isMarkActive(ctx, linkSchema.type(ctx), currentSelection),
    };
}

export function observeEditorState(ctx: Ctx, onUpdate: () => void): () => void {
    const view = ctx.get(editorViewCtx);
    const observer = new Plugin({
        view: () => ({
            update: onUpdate,
        }),
    });

    view.updateState(
        view.state.reconfigure({
            plugins: [...view.state.plugins, observer],
        })
    );

    return () => {
        if (view.isDestroyed) {
            return;
        }

        view.updateState(
            view.state.reconfigure({
                plugins: view.state.plugins.filter((plugin) => plugin !== observer),
            })
        );
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

export function insertImage(ctx: Ctx): void {
    const view = ctx.get(editorViewCtx);
    const { selection } = view.state;
    const { $from } = selection;
    const imageBlock = imageBlockSchema.type(ctx);
    const containerDepth = $from.depth - 1;
    const paragraphIndex = containerDepth >= 0 ? $from.index(containerDepth) : -1;
    const isEmptyParagraph =
        selection.empty &&
        $from.parent.type === paragraphSchema.type(ctx) &&
        $from.parent.content.size === 0;
    const canReplaceParagraphWithBlock =
        isEmptyParagraph &&
        containerDepth >= 0 &&
        $from.node(containerDepth).canReplaceWith(paragraphIndex, paragraphIndex + 1, imageBlock);
    const commands = ctx.get(commandsCtx);

    if (
        canReplaceParagraphWithBlock &&
        commands.call(addBlockTypeCommand.key, {
            nodeType: imageBlock,
        })
    ) {
        return;
    }

    commands.call(insertImageCommand.key);
}

export function EditorMarkdownSidebar(props: EditorMarkdownSidebarProps): JSX.Element {
    const { t } = useI18N();
    const [selectedHeadingLevel, setSelectedHeadingLevel] = createSignal(0);
    const [selectedInlineStyles, setSelectedInlineStyles] =
        createSignal<InlineStyleState>(EMPTY_INLINE_STYLE_STATE);

    const updateSelectedState = (ctx: Ctx, selection?: Selection): void => {
        setSelectedHeadingLevel(getHeadingLevel(ctx, selection));
        setSelectedInlineStyles(getInlineStyleState(ctx, selection));
    };

    createEffect(() => {
        const editor = props.getEditor();
        if (!editor) {
            setSelectedHeadingLevel(0);
            setSelectedInlineStyles(EMPTY_INLINE_STYLE_STATE);
            return;
        }

        let stopObserving = (): void => undefined;
        editor.action((ctx) => {
            updateSelectedState(ctx);
            stopObserving = observeEditorState(ctx, () => updateSelectedState(ctx));
        });
        onCleanup(() => stopObserving());
    });

    return (
        <AppSidebar disabled={props.disabled}>
            <SidebarTab
                selectedKey={props.selectedTab}
                onSelectedKeyChange={(key) => key && props.onSelectedTabChange(key)}
            >
                <SidebarTabSection key="format" label={t("search.format")}>
                <section class="sidebarSection">
                    <h2 class="sidebarSectionTitle">{t("markdownToolbar.blockStyle")}</h2>
                    <div class="sidebarButtonGrid sidebarButtonGrid--6">
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedHeadingLevel() === 1}
                            icon={Heading1}
                            label={t("markdownToolbar.heading1")}
                            onRun={(ctx) => {
                                setHeading(ctx, 1);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedHeadingLevel() === 2}
                            icon={Heading2}
                            label={t("markdownToolbar.heading2")}
                            onRun={(ctx) => {
                                setHeading(ctx, 2);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedHeadingLevel() === 3}
                            icon={Heading3}
                            label={t("markdownToolbar.heading3")}
                            onRun={(ctx) => {
                                setHeading(ctx, 3);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedHeadingLevel() === 4}
                            icon={Heading4}
                            label={t("markdownToolbar.heading4")}
                            onRun={(ctx) => {
                                setHeading(ctx, 4);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedHeadingLevel() === 5}
                            icon={Heading5}
                            label={t("markdownToolbar.heading5")}
                            onRun={(ctx) => {
                                setHeading(ctx, 5);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedHeadingLevel() === 6}
                            icon={Heading6}
                            label={t("markdownToolbar.heading6")}
                            onRun={(ctx) => {
                                setHeading(ctx, 6);
                                updateSelectedState(ctx);
                            }}
                        />
                    </div>
                    <SidebarButton
                        getEditor={props.getEditor}
                        selected={selectedHeadingLevel() === 0}
                        icon={TextAlignStart}
                        label={t("markdownToolbar.normal")}
                        onRun={(ctx) => {
                            setHeading(ctx, 0);
                            updateSelectedState(ctx);
                        }}
                    />

                    <div class="sidebarButtonGrid sidebarButtonGrid--2">
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

                <section class="sidebarSection">
                    <h2 class="sidebarSectionTitle">{t("markdownToolbar.formatting")}</h2>
                    <div class="sidebarButtonGrid sidebarButtonGrid--6">
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedInlineStyles().bold}
                            icon={Bold}
                            label={t("markdownToolbar.bold")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(toggleStrongCommand.key);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedInlineStyles().italic}
                            icon={Italic}
                            label={t("markdownToolbar.italic")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(toggleEmphasisCommand.key);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedInlineStyles().strikethrough}
                            icon={Strikethrough}
                            label={t("markdownToolbar.strikethrough")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call(toggleStrikethroughCommand.key);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedInlineStyles().link}
                            icon={Link2}
                            label={t("markdownToolbar.link")}
                            onRun={(ctx) => {
                                toggleLink(ctx);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedInlineStyles().code}
                            icon={Code}
                            label={t("markdownToolbar.inlineCode")}
                            onRun={(ctx) => {
                                toggleInlineCode(ctx);
                                updateSelectedState(ctx);
                            }}
                        />
                        <SidebarIconButton
                            getEditor={props.getEditor}
                            selected={selectedInlineStyles().math}
                            icon={Sigma}
                            label={t("markdownToolbar.inlineMath")}
                            onRun={(ctx) => {
                                ctx.get(commandsCtx).call("ToggleLatex");
                                updateSelectedState(ctx);
                            }}
                        />
                    </div>
                </section>
                <section class="sidebarSection">
                    <h2 class="sidebarSectionTitle">{t("markdownToolbar.lists")}</h2>

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
                    <div class="sidebarButtonGrid sidebarButtonGrid--2">
                        <SidebarButton
                            getEditor={props.getEditor}
                            icon={IndentIncrease}
                            label={t("markdownToolbar.increaseIndent")}
                            onRun={(ctx) => ctx.get(commandsCtx).call(sinkListItemCommand.key)}
                        />
                        <SidebarButton
                            getEditor={props.getEditor}
                            icon={IndentDecrease}
                            label={t("markdownToolbar.decreaseIndent")}
                            onRun={(ctx) => ctx.get(commandsCtx).call(liftListItemCommand.key)}
                        />
                    </div>
                </section>
                <section class="sidebarSection">
                    <h2 class="sidebarSectionTitle">{t("markdownToolbar.blocks")}</h2>

                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={ImageIcon}
                        label={t("markdownToolbar.image")}
                        onRun={insertImage}
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
                        icon={SquareCode}
                        label={t("markdownToolbar.codeBlock")}
                        onRun={(ctx) => {
                            ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
                                nodeType: codeBlockSchema.type(ctx),
                            });
                        }}
                    />
                    <SidebarButton
                        getEditor={props.getEditor}
                        icon={SquareSigma}
                        label={t("markdownToolbar.mathBlock")}
                        onRun={(ctx) => {
                            ctx.get(commandsCtx).call(addBlockTypeCommand.key, {
                                nodeType: codeBlockSchema.type(ctx),
                                attrs: { language: "LaTeX" },
                            });
                        }}
                    />
                </section>
                <section class="sidebarSection">
                    <h2 class="sidebarSectionTitle">{t("markdownToolbar.document")}</h2>
                    <SidebarButton
                        getEditor={props.getEditor}
                        selected={props.frontmatterVisible}
                        focusEditorAfterRun={false}
                        icon={FileCog}
                        label={t("markdownToolbar.frontmatter")}
                        onRun={props.onToggleFrontmatter}
                    />
                </section>
                </SidebarTabSection>
                <SidebarTabSection key="search" label={t("search.title")}>
                    <SearchPanel
                        controller={props.searchController}
                        registerFocus={props.registerSearchFocus}
                    />
                </SidebarTabSection>
            </SidebarTab>
        </AppSidebar>
    );
}

export default EditorMarkdownSidebar;
