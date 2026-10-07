/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { EditorView } from "@milkdown/kit/prose/view";
import { Plugin } from "@milkdown/kit/prose/state";
import {
    findNext,
    findPrev,
    replaceAll,
    replaceNext,
    search,
    SearchQuery,
    setSearchState,
} from "prosemirror-search";
import {
    EMPTY_SEARCH_QUERY,
    type SearchController,
    type SearchQueryOptions,
    type SearchStatus,
} from "./SearchController";

type Match = { from: number; to: number };

export class ProseMirrorSearchController implements SearchController {
    private queryOptions: SearchQueryOptions = { ...EMPTY_SEARCH_QUERY };
    private readonly listeners = new Set<(status: SearchStatus) => void>();
    private readonly searchPlugin = search();
    private readonly observerPlugin: Plugin;
    private destroyed = false;

    constructor(private readonly view: EditorView) {
        this.observerPlugin = new Plugin({
            view: () => ({
                update: () => this.emit(),
            }),
        });
        this.view.updateState(
            this.view.state.reconfigure({
                plugins: [...this.view.state.plugins, this.searchPlugin, this.observerPlugin],
            })
        );
    }

    getQuery(): SearchQueryOptions {
        return { ...this.queryOptions };
    }

    getStatus(): SearchStatus {
        if (this.destroyed) {
            return { total: 0, current: null, valid: false };
        }

        const query = this.createQuery();
        if (!query.valid) {
            return { total: 0, current: null, valid: false };
        }

        const matches = this.collectMatches(query);
        const { from, to } = this.view.state.selection;
        const currentIndex = matches.findIndex((match) => match.from === from && match.to === to);

        return {
            total: matches.length,
            current: currentIndex >= 0 ? currentIndex + 1 : null,
            valid: true,
        };
    }

    subscribe(listener: (status: SearchStatus) => void): () => void {
        this.listeners.add(listener);
        listener(this.getStatus());
        return () => this.listeners.delete(listener);
    }

    updateQuery(query: SearchQueryOptions): void {
        if (this.destroyed) return;
        this.queryOptions = { ...query };
        this.view.dispatch(setSearchState(this.view.state.tr, this.createQuery()));
        this.emit();
    }

    findNext(): boolean {
        return this.runCommand(findNext, true);
    }

    findPrevious(): boolean {
        return this.runCommand(findPrev, true);
    }

    replaceCurrent(): boolean {
        if (this.getStatus().current === null) return false;
        return this.runCommand(replaceNext, true);
    }

    replaceAll(): number {
        const count = this.getStatus().total;
        if (count === 0 || !this.runCommand(replaceAll)) return 0;
        return count;
    }

    focusEditor(): void {
        if (!this.destroyed) this.view.focus();
    }

    clear(): void {
        this.updateQuery({ ...EMPTY_SEARCH_QUERY });
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.listeners.clear();
        if (!this.view.isDestroyed) {
            this.view.updateState(
                this.view.state.reconfigure({
                    plugins: this.view.state.plugins.filter(
                        (plugin) => plugin !== this.searchPlugin && plugin !== this.observerPlugin
                    ),
                })
            );
        }
    }

    private createQuery(): SearchQuery {
        return new SearchQuery({
            search: this.queryOptions.search,
            replace: this.queryOptions.replacement,
            caseSensitive: this.queryOptions.caseSensitive,
            wholeWord: this.queryOptions.wholeWord,
            regexp: this.queryOptions.regexp,
        });
    }

    private collectMatches(query: SearchQuery): Match[] {
        const matches: Match[] = [];
        const end = this.view.state.doc.content.size;
        let position = 0;

        while (position <= end) {
            const match = query.findNext(this.view.state, position, end);
            if (!match) break;
            matches.push({ from: match.from, to: match.to });
            position = match.to > position ? match.to : position + 1;
        }

        return matches;
    }

    private runCommand(
        command: (state: typeof this.view.state, dispatch?: typeof this.view.dispatch) => boolean,
        revealSelection = false
    ): boolean {
        if (this.destroyed) return false;
        const handled = command(this.view.state, this.view.dispatch);
        if (handled && revealSelection) this.revealSelection();
        this.emit();
        return handled;
    }

    private revealSelection(): void {
        const { from } = this.view.state.selection;
        const position = this.view.domAtPos(from, 1);
        const child = position.node.childNodes[position.offset] ?? position.node;
        const element =
            child instanceof Element
                ? child
                : (child.parentElement ??
                  (position.node instanceof Element ? position.node : position.node.parentElement));

        element?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    private emit(): void {
        if (this.destroyed) return;
        const status = this.getStatus();
        this.listeners.forEach((listener) => listener(status));
    }
}
