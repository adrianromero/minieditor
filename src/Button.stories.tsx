import type { Meta, StoryObj } from "storybook-solidjs-vite";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import ExternalLink from "lucide-solid/icons/external-link";
import File from "lucide-solid/icons/file";
import Folder from "lucide-solid/icons/folder";
import LinkIcon from "lucide-solid/icons/link";
import RefreshCw from "lucide-solid/icons/refresh-cw";
import Save from "lucide-solid/icons/save";
import type { JSX } from "solid-js";
import breadcrumbStyles from "./FileBreadcrumb.module.css";
import styles from "./Button.stories.module.css";
import externalFileStyles from "./viewers/EditorExternalFile.module.css";
import folderStyles from "./viewers/EditorFolder.module.css";
import floatingStyles from "./viewers/MarkdownImageActions.module.css";

const meta = {
    title: "Components/Buttons",
    parameters: {
        layout: "padded",
    },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type ButtonStatesProps = {
    normal: JSX.Element;
    selected: JSX.Element;
    disabled: JSX.Element;
};

function ButtonStates(props: ButtonStatesProps): JSX.Element {
    return (
        <div class={styles.states}>
            <div class={styles.state}>
                <span class={styles.stateLabel}>Normal</span>
                {props.normal}
            </div>
            <div class={styles.state}>
                <span class={styles.stateLabel}>Selected</span>
                {props.selected}
            </div>
            <div class={styles.state}>
                <span class={styles.stateLabel}>Deshabilitado</span>
                {props.disabled}
            </div>
        </div>
    );
}

function Variant(props: {
    name: string;
    source: string;
    note?: string;
    children: JSX.Element;
}): JSX.Element {
    return (
        <article class={styles.variant}>
            <h3 class={styles.variantTitle}>{props.name}</h3>
            <code class={styles.source}>{props.source}</code>
            {props.children}
            {props.note && <p class={styles.note}>{props.note}</p>}
        </article>
    );
}

function FloatingImageButton(props: {
    label: string;
    selected?: boolean;
    disabled?: boolean;
}): JSX.Element {
    return (
        <div class={styles.floatingStage}>
            <div class={`${floatingStyles.actions} milkdown`}>
                <div class={`milkdown-code-block ${floatingStyles.crepeButtonHost}`}>
                    <div class="tools">
                        <div class={`tools-button-group ${floatingStyles.buttonGroup}`}>
                            <button
                                class={`copy-button ${floatingStyles.fltButton} ${props.selected ? "selected" : ""}`}
                                aria-label={props.label}
                                aria-pressed={props.selected}
                                disabled={props.disabled}
                            >
                                <LinkIcon />
                                Abrir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const GlobalTheme: Story = {
    name: "Globales · theme.css",
    render: () => (
        <div class={styles.catalog}>
            <section class={styles.section}>
                <h2 class={styles.sectionTitle}>Botones globales</h2>
                <p class={styles.introduction}>
                    Variantes basadas exclusivamente en las clases globales de theme.css. El estado
                    seleccionado utiliza la clase persistente de selección disponible para cada
                    variante, aunque todavía no tenga reglas visuales asociadas.
                </p>

                <Variant name="Primario" source=".stdButton">
                    <ButtonStates
                        normal={<button class="stdButton">Continuar</button>}
                        selected={<button class="stdButton selected">Continuar</button>}
                        disabled={
                            <button class="stdButton" disabled={true}>
                                Continuar
                            </button>
                        }
                    />
                </Variant>

                <Variant
                    name="Secundario"
                    source=".stdButton.secondary"
                    note="Definido en theme.css, pero ningún componente lo utiliza actualmente."
                >
                    <ButtonStates
                        normal={<button class="stdButton secondary">Cancelar</button>}
                        selected={<button class="stdButton secondary selected">Cancelar</button>}
                        disabled={
                            <button class="stdButton secondary" disabled={true}>
                                Cancelar
                            </button>
                        }
                    />
                </Variant>

                <Variant name="Toolbar" source=".stdButton.toolbar · .selected">
                    <ButtonStates
                        normal={
                            <button class="stdButton toolbar" aria-label="Actualizar">
                                <RefreshCw />
                            </button>
                        }
                        selected={
                            <button
                                class="stdButton toolbar selected"
                                aria-label="Actualizar seleccionado"
                                aria-pressed="true"
                            >
                                <RefreshCw />
                            </button>
                        }
                        disabled={
                            <button
                                class="stdButton toolbar"
                                aria-label="Actualizar deshabilitado"
                                disabled={true}
                            >
                                <RefreshCw />
                            </button>
                        }
                    />
                </Variant>

                <Variant
                    name="Pequeño"
                    source=".stdButton.small · .selected"
                    note="Solo aparece en código comentado de EditorFolder; no tiene uso activo."
                >
                    <ButtonStates
                        normal={
                            <button class="stdButton small">
                                <Save /> Guardar
                            </button>
                        }
                        selected={
                            <button class="stdButton small selected" aria-pressed="true">
                                <Save /> Guardar
                            </button>
                        }
                        disabled={
                            <button class="stdButton small" disabled={true}>
                                <Save /> Guardar
                            </button>
                        }
                    />
                </Variant>

                <Variant
                    name="Pestaña global"
                    source=".stdButton.tab · .selected"
                    note="Es la variante utilizada por las pestañas de Sidebar."
                >
                    <ButtonStates
                        normal={
                            <div class={styles.tabStrip}>
                                <button class="stdButton tab" role="tab" aria-selected="false">
                                    Ajustar
                                </button>
                            </div>
                        }
                        selected={
                            <div class={styles.tabStrip}>
                                <button
                                    class="stdButton tab selected"
                                    role="tab"
                                    aria-selected="true"
                                >
                                    Ajustar
                                </button>
                            </div>
                        }
                        disabled={
                            <div class={styles.tabStrip}>
                                <button
                                    class="stdButton tab"
                                    role="tab"
                                    aria-selected="false"
                                    disabled={true}
                                >
                                    Ajustar
                                </button>
                            </div>
                        }
                    />
                </Variant>
            </section>
        </div>
    ),
};

export const ComponentScoped: Story = {
    name: "Específicos · CSS Modules",
    render: () => (
        <div class={styles.catalog}>
            <section class={styles.section}>
                <h2 class={styles.sectionTitle}>Botones específicos de componentes</h2>
                <p class={styles.introduction}>
                    Estos botones no dependen únicamente de stdButton. Importan directamente el
                    mismo módulo CSS que utiliza su componente para evitar duplicar su aspecto en el
                    catálogo.
                </p>

                <Variant
                    name="Enlace de breadcrumb"
                    source="FileBreadcrumb.module.css · .segmentLink"
                    note="Todavía no define una apariencia específica para .selected; :disabled neutraliza también :hover y :active."
                >
                    <ButtonStates
                        normal={<button class={breadcrumbStyles.segmentLink}>projects</button>}
                        selected={
                            <button class={`${breadcrumbStyles.segmentLink} selected`}>
                                projects
                            </button>
                        }
                        disabled={
                            <button class={breadcrumbStyles.segmentLink} disabled={true}>
                                projects
                            </button>
                        }
                    />
                </Variant>

                <Variant
                    name="Entrada de carpeta"
                    source="EditorFolder.module.css · .entryButton"
                    note="Todavía no define una apariencia específica para .selected; :disabled neutraliza también :hover y :active."
                >
                    <ButtonStates
                        normal={
                            <ul class={styles.folderList}>
                                <li>
                                    <button class={folderStyles.entryButton}>
                                        <Folder
                                            class={`${folderStyles.entryIcon} ${folderStyles.directoryIcon}`}
                                        />
                                        <span class={folderStyles.entryName}>documents</span>
                                    </button>
                                </li>
                            </ul>
                        }
                        selected={
                            <ul class={styles.folderList}>
                                <li>
                                    <button class={`${folderStyles.entryButton} selected`}>
                                        <Folder
                                            class={`${folderStyles.entryIcon} ${folderStyles.directoryIcon}`}
                                        />
                                        <span class={folderStyles.entryName}>documents</span>
                                    </button>
                                </li>
                            </ul>
                        }
                        disabled={
                            <ul class={styles.folderList}>
                                <li>
                                    <button class={folderStyles.entryButton} disabled={true}>
                                        <File
                                            class={`${folderStyles.entryIcon} ${folderStyles.fileIcon}`}
                                        />
                                        <span class={folderStyles.entryName}>notes.md</span>
                                    </button>
                                </li>
                            </ul>
                        }
                    />
                </Variant>

                <Variant
                    name="Acción flotante de imagen"
                    source="Crepe · .milkdown-code-block .tools .tools-button-group"
                    note="Reutiliza directamente la estructura y los estilos de los botones de acción de los bloques de código de Crepe."
                >
                    <ButtonStates
                        normal={<FloatingImageButton label="Abrir imagen" />}
                        selected={
                            <FloatingImageButton label="Abrir imagen seleccionada" selected />
                        }
                        disabled={
                            <FloatingImageButton label="Abrir imagen deshabilitada" disabled />
                        }
                    />
                </Variant>

                <Variant
                    name="Abrir archivo externo · estilo mixto"
                    source="theme.css · .stdButton + EditorExternalFile.module.css · .externalFile button"
                    note="La base y los estados son globales; el módulo del componente añade el espaciado entre icono y texto."
                >
                    <ButtonStates
                        normal={
                            <div
                                class={`${externalFileStyles.externalFile} ${styles.externalStage}`}
                            >
                                <button class="stdButton">
                                    <ExternalLink class="actionIcon" /> Abrir archivo
                                </button>
                            </div>
                        }
                        selected={
                            <div
                                class={`${externalFileStyles.externalFile} ${styles.externalStage}`}
                            >
                                <button class="stdButton selected">
                                    <ExternalLink class="actionIcon" /> Abrir archivo
                                </button>
                            </div>
                        }
                        disabled={
                            <div
                                class={`${externalFileStyles.externalFile} ${styles.externalStage}`}
                            >
                                <button class="stdButton" disabled={true}>
                                    <ExternalLink class="actionIcon" /> Abrir archivo
                                </button>
                            </div>
                        }
                    />
                </Variant>
            </section>
        </div>
    ),
};
