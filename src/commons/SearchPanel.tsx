/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createEffect, createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { useI18N } from "../Localization";
import {
    EMPTY_SEARCH_QUERY,
    EMPTY_SEARCH_STATUS,
    type SearchController,
    type SearchQueryOptions,
    type SearchStatus,
} from "../search/SearchController";
import styles from "./SearchPanel.module.css";

export type SearchPanelProps = {
    controller: SearchController | null;
    registerFocus?: (focus: (() => void) | null) => void;
};

export function SearchPanel(props: SearchPanelProps): JSX.Element {
    let searchInput!: HTMLInputElement;
    const { t } = useI18N();
    const [query, setQuery] = createSignal<SearchQueryOptions>({ ...EMPTY_SEARCH_QUERY });
    const [status, setStatus] = createSignal<SearchStatus>({ ...EMPTY_SEARCH_STATUS });

    const updateQuery = (patch: Partial<SearchQueryOptions>): void => {
        const next = { ...query(), ...patch };
        setQuery(next);
        props.controller?.updateQuery(next);
    };
    const focusSearch = (): void => {
        searchInput.focus();
        searchInput.select();
    };

    createEffect(() => {
        const controller = props.controller;
        if (!controller) {
            setQuery({ ...EMPTY_SEARCH_QUERY });
            setStatus({ ...EMPTY_SEARCH_STATUS });
            return;
        }

        setQuery(controller.getQuery());
        const unsubscribe = controller.subscribe(setStatus);
        onCleanup(unsubscribe);
    });

    onMount(() => {
        props.registerFocus?.(focusSearch);
    });
    onCleanup(() => props.registerFocus?.(null));

    const canNavigate = (): boolean => status().valid && status().total > 0;
    const canReplaceCurrent = (): boolean => canNavigate() && status().current !== null;
    const counterText = (): string => `${status().current ?? 0} / ${status().total}`;

    return (
        <section class={styles.panel} aria-label={t("search.title")}>
            <div class={styles.searchField}>
                <input
                    ref={searchInput}
                    class={`${styles.input} ${styles.searchInput}`}
                    type="text"
                    value={query().search}
                    aria-label={t("search.searchFor")}
                    placeholder={t("search.searchFor")}
                    aria-invalid={query().search.length > 0 && !status().valid}
                    onInput={(event) => updateQuery({ search: event.currentTarget.value })}
                    onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        if (event.shiftKey) props.controller?.findPrevious();
                        else props.controller?.findNext();
                    }}
                />
                <span class={styles.counter} aria-live="polite">
                    {counterText()}
                </span>
            </div>

            <input
                class={styles.input}
                type="text"
                value={query().replacement}
                aria-label={t("search.replaceWith")}
                placeholder={t("search.replaceWith")}
                onInput={(event) => updateQuery({ replacement: event.currentTarget.value })}
                onKeyDown={(event) => {
                    if (event.key !== "Enter" || !canReplaceCurrent()) return;
                    event.preventDefault();
                    props.controller?.replaceCurrent();
                }}
            />

            <div class={styles.options}>
                <SwitchOption
                    label={t("search.matchCase")}
                    checked={query().caseSensitive}
                    onChange={(checked) => updateQuery({ caseSensitive: checked })}
                />
                <SwitchOption
                    label={t("search.wholeWord")}
                    checked={query().wholeWord}
                    onChange={(checked) => updateQuery({ wholeWord: checked })}
                />
                <SwitchOption
                    label={t("search.regexp")}
                    checked={query().regexp}
                    onChange={(checked) => updateQuery({ regexp: checked })}
                />
                {query().search.length > 0 && !status().valid ? (
                    <span class={styles.invalid}>{t("search.invalidRegexp")}</span>
                ) : null}
            </div>

            <div class={styles.buttonRow}>
                <button
                    type="button"
                    class={`stdButton secondary ${styles.textButton}`}
                    disabled={!canReplaceCurrent()}
                    onClick={() => props.controller?.replaceCurrent()}
                >
                    {t("search.replace")}
                </button>
                <button
                    type="button"
                    class={`stdButton secondary ${styles.textButton}`}
                    disabled={!canNavigate()}
                    onClick={() => props.controller?.replaceAll()}
                >
                    {t("search.replaceAll")}
                </button>
            </div>

            <div class={styles.buttonRow}>
                <button
                    type="button"
                    class={`stdButton secondary ${styles.textButton}`}
                    disabled={!canNavigate()}
                    onClick={() => props.controller?.findPrevious()}
                >
                    {t("search.previous")}
                </button>
                <button
                    type="button"
                    class={`stdButton ${styles.textButton}`}
                    disabled={!canNavigate()}
                    onClick={() => props.controller?.findNext()}
                >
                    {t("search.next")}
                </button>
            </div>
        </section>
    );
}

type SwitchOptionProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

function SwitchOption(props: SwitchOptionProps): JSX.Element {
    return (
        <label class={styles.switchOption}>
            <input
                class={styles.switch}
                type="checkbox"
                role="switch"
                checked={props.checked}
                onChange={(event) => props.onChange(event.currentTarget.checked)}
            />
            <span>{props.label}</span>
        </label>
    );
}

export default SearchPanel;
