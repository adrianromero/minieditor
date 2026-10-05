import type { Meta, StoryObj } from "storybook-solidjs-vite";
import ExternalLink from "lucide-solid/icons/external-link";
import File from "lucide-solid/icons/file";
import Folder from "lucide-solid/icons/folder";
import LinkIcon from "lucide-solid/icons/link";
import RefreshCw from "lucide-solid/icons/refresh-cw";
import Save from "lucide-solid/icons/save";
import type { JSX } from "solid-js";
import breadcrumbStyles from "./FileBreadcrumb.module.css";
import styles from "./Button.stories.module.css";
import sidebarTabStyles from "./commons/SidebarTabSection.module.css";
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
    active: JSX.Element;
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
                <span class={styles.stateLabel}>Activo</span>
                {props.active}
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

export const GlobalTheme: Story = {
    name: "Globales · theme.css",
    render: () => (
        <div class={styles.catalog}>
            <section class={styles.section}>
                <h2 class={styles.sectionTitle}>Botones globales</h2>
                <p class={styles.introduction}>
                    Variantes basadas exclusivamente en las clases globales de theme.css. El estado
                    activo reproduce el aspecto transitorio de :active o la clase persistente de
                    selección disponible para esa variante.
                </p>

                <Variant name="Primario" source='.stdButton'>
                    <ButtonStates
                        normal={<button class="stdButton">Continuar</button>}
                        active={<button class={`stdButton ${styles.primaryActive}`}>Continuar</button>}
                        disabled={<button class="stdButton" disabled>Continuar</button>}
                    />
                </Variant>

                <Variant
                    name="Secundario"
                    source='.stdButton.secondary'
                    note="Definido en theme.css, pero ningún componente lo utiliza actualmente."
                >
                    <ButtonStates
                        normal={<button class="stdButton secondary">Cancelar</button>}
                        active={
                            <button class={`stdButton secondary ${styles.secondaryActive}`}>
                                Cancelar
                            </button>
                        }
                        disabled={<button class="stdButton secondary" disabled>Cancelar</button>}
                    />
                </Variant>

                <Variant name="Toolbar" source='.stdButton.toolbar · .selected'>
                    <ButtonStates
                        normal={<button class="stdButton toolbar" aria-label="Actualizar"><RefreshCw /></button>}
                        active={<button class="stdButton toolbar selected" aria-label="Actualizar seleccionado" aria-pressed="true"><RefreshCw /></button>}
                        disabled={<button class="stdButton toolbar" aria-label="Actualizar deshabilitado" disabled><RefreshCw /></button>}
                    />
                </Variant>

                <Variant
                    name="Pequeño"
                    source='.stdButton.small · .active'
                    note="Solo aparece en código comentado de EditorFolder; no tiene uso activo."
                >
                    <ButtonStates
                        normal={<button class="stdButton small"><Save /> Guardar</button>}
                        active={<button class="stdButton small active" aria-pressed="true"><Save /> Guardar</button>}
                        disabled={<button class="stdButton small" disabled><Save /> Guardar</button>}
                    />
                </Variant>

                <Variant
                    name="Pestaña global"
                    source='.stdButton.tab · .activeTab'
                    note="Definido en theme.css, pero las pestañas actuales usan SidebarTabSection.module.css."
                >
                    <ButtonStates
                        normal={<button class="stdButton tab">Ajustar</button>}
                        active={<button class="stdButton tab activeTab" role="tab" aria-selected="true">Ajustar</button>}
                        disabled={<button class="stdButton tab" disabled>Ajustar</button>}
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
                    Estos botones no dependen únicamente de stdButton. Importan directamente el mismo
                    módulo CSS que utiliza su componente para evitar duplicar su aspecto en el catálogo.
                </p>

                <Variant
                    name="Enlace de breadcrumb"
                    source="FileBreadcrumb.module.css · .segmentLink"
                    note="No define :active ni :disabled; el estado activo mostrado corresponde a su regla :hover."
                >
                    <ButtonStates
                        normal={<button class={breadcrumbStyles.segmentLink}>projects</button>}
                        active={<button class={`${breadcrumbStyles.segmentLink} ${styles.breadcrumbActive}`}>projects</button>}
                        disabled={<button class={breadcrumbStyles.segmentLink} disabled>projects</button>}
                    />
                </Variant>

                <Variant
                    name="Pestaña de Sidebar"
                    source="SidebarTabSection.module.css · .tab · .active"
                    note="El módulo define la selección activa. El aspecto deshabilitado se aplica realmente mediante la opacidad del contenedor Sidebar, no en el propio botón."
                >
                    <ButtonStates
                        normal={<div class={styles.tabStrip}><button class={sidebarTabStyles.tab} role="tab" aria-selected="false">Transformar</button></div>}
                        active={<div class={styles.tabStrip}><button class={`${sidebarTabStyles.tab} ${sidebarTabStyles.active}`} role="tab" aria-selected="true">Transformar</button></div>}
                        disabled={<div class={styles.tabStrip}><button class={sidebarTabStyles.tab} role="tab" aria-selected="false" disabled>Transformar</button></div>}
                    />
                </Variant>

                <Variant
                    name="Entrada de carpeta"
                    source="EditorFolder.module.css · .entryButton"
                    note="No tiene :active ni :disabled propios; el estado activo mostrado reproduce su realce de :hover."
                >
                    <ButtonStates
                        normal={<ul class={styles.folderList}><li><button class={folderStyles.entryButton}><Folder class={`${folderStyles.entryIcon} ${folderStyles.directoryIcon}`} /><span class={folderStyles.entryName}>documents</span></button></li></ul>}
                        active={<ul class={styles.folderList}><li><button class={`${folderStyles.entryButton} ${styles.folderActive}`}><Folder class={`${folderStyles.entryIcon} ${folderStyles.directoryIcon}`} /><span class={folderStyles.entryName}>documents</span></button></li></ul>}
                        disabled={<ul class={styles.folderList}><li><button class={folderStyles.entryButton} disabled><File class={`${folderStyles.entryIcon} ${folderStyles.fileIcon}`} /><span class={folderStyles.entryName}>notes.md</span></button></li></ul>}
                    />
                </Variant>

                <Variant
                    name="Acción flotante de imagen"
                    source="MarkdownImageActions.module.css · .actions > .fltButton"
                    note="El módulo define :active, pero no una apariencia específica para disabled."
                >
                    <ButtonStates
                        normal={<div class={styles.floatingStage}><div class={floatingStyles.actions}><button class={floatingStyles.fltButton} aria-label="Abrir imagen"><LinkIcon /></button></div></div>}
                        active={<div class={styles.floatingStage}><div class={floatingStyles.actions}><button class={`${floatingStyles.fltButton} ${styles.componentActive}`} aria-label="Abrir imagen activa"><LinkIcon /></button></div></div>}
                        disabled={<div class={styles.floatingStage}><div class={floatingStyles.actions}><button class={floatingStyles.fltButton} aria-label="Abrir imagen deshabilitada" disabled><LinkIcon /></button></div></div>}
                    />
                </Variant>

                <Variant
                    name="Abrir archivo externo · estilo mixto"
                    source="theme.css · .stdButton + EditorExternalFile.module.css · .externalFile button"
                    note="La base y los estados son globales; el módulo del componente añade el espaciado entre icono y texto."
                >
                    <ButtonStates
                        normal={<div class={`${externalFileStyles.externalFile} ${styles.externalStage}`}><button class="stdButton"><ExternalLink class="actionIcon" /> Abrir archivo</button></div>}
                        active={<div class={`${externalFileStyles.externalFile} ${styles.externalStage}`}><button class={`stdButton ${styles.primaryActive}`}><ExternalLink class="actionIcon" /> Abrir archivo</button></div>}
                        disabled={<div class={`${externalFileStyles.externalFile} ${styles.externalStage}`}><button class="stdButton" disabled><ExternalLink class="actionIcon" /> Abrir archivo</button></div>}
                    />
                </Variant>
            </section>
        </div>
    ),
};
