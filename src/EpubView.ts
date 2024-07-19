import { WorkspaceLeaf, FileView, TFile } from "obsidian";
import { OpenEpubPluginSettings } from "./OpenEpubPluginSettings";
import * as ePub from 'epubjs';

export const EPUB_FILE_EXTENSION = "epub";
export const VIEW_TYPE_EPUB = "epub";
export const ICON_EPUB = "doc-epub";

export class EpubView extends FileView {


    // allowNoFile = false;
    private previousButtonId = 'previous';
    private nextButtonId = 'next';


    private options = {
        width: "100%",
        height: "100%"
    }

    private prevButton = document.createElement('button');
    private nextButton = document.createElement('button');

    constructor(leaf: WorkspaceLeaf, private settings: OpenEpubPluginSettings) {
        super(leaf);

        this.prevButton.id = this.previousButtonId;
        this.prevButton.style.width = '5%';
        this.prevButton.style.height = '100%';

        this.nextButton.id = this.nextButtonId;
        this.nextButton.style.width = '5%';
        this.nextButton.style.height = '100%';
    }

    static get displayName() {
        return "EPUB Viewer";
    }

    static get icon() {
        return ICON_EPUB;
    }

    static get defaultViewState() {
        return {
            mode: "default",
            state: {},
        };
    }

    static get type() {
        return VIEW_TYPE_EPUB;
    }

    // 修改文本颜色
    static updateTextColors() { }

    /**
     * 创建层叠样式表并且插入到head标签
     * @param cssContent css内容
     * @returns element 提供给关闭插件释放元素
     */
    static createAndInsertStylessheet(cssContent: string) {
        const blob = new Blob([cssContent], { type: "text/css" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("link");
        link.href = url;
        link.rel = "stylesheet";
        link.type = "text/css";

        document.head.appendChild(link);

        return link;
    }

    private path_currentLocation = "currentLocation.json"
    saveDisplayLocation(rendition: ePub.Rendition) {
        // 记录当前阅读进度
        const displayedLocation = rendition.currentLocation();
        console.log('displayedLocation', displayedLocation);
        this.app.vault.adapter.write(this.path_currentLocation, JSON.stringify(displayedLocation));
    }
    async getDisplayLocation(): Promise<ePub.Location> {
        return this.app.vault.adapter.read(this.path_currentLocation).then((content) => {
            return JSON.parse(content) as ePub.Location;
        });
    }

    async onLoadFile(file: TFile): Promise<void> {
        console.log('loading epub view');
        this.contentEl.empty();

        const contents = await this.app.vault.adapter.readBinary(file.path);

        // book.destroy();
        const book = ePub.default(contents);

        // // 满阅览视图渲染
        const viewElement = document.createElement('div');
        viewElement.id = book.opening.id;
        viewElement.style.width = '90%';
        viewElement.style.height = '100%';

        const rendition = book.renderTo(viewElement.id, this.options);

        // 设置上一页按钮
        this.prevButton.onclick = () => {
            rendition.prev();
            // 记录当前阅读进度
            this.saveDisplayLocation(rendition);
        };

        // 设置下一页按钮
        this.nextButton.onclick = () => {
            rendition.next();
            // 记录当前阅读进度
            this.saveDisplayLocation(rendition);
        };

        // TODO: 修改Epub字体颜色，可以尝试根据viewElement找到下属的#document嵌入式html的body标签，并修改css样式
        // 设置控件

        this.contentEl.style.display = 'flex';
        this.contentEl.appendChild(this.prevButton);
        this.contentEl.appendChild(viewElement);
        this.contentEl.appendChild(this.nextButton);

        this.getDisplayLocation().then((location: ePub.Location) => {
            // const index_log = location.start.index ?? 0
            // console.log('index', index_log)
            console.log('location', location);
            let index = 0;
            // 判断location是不是内容为{}
            if (Object.keys(location).length > 0 && Object.keys(location.start).length > 0) {
                index = location.start.index;
            }
            rendition.display(index);
        });

        console.log('rendition', rendition);
        return super.onLoadFile(file);
    }




    onunload(): void {
        console.log('unloading epub view');
    }

    getDisplayText() {
        if (this.file) {
            return this.file.basename;
        } else {
            return 'No File';
        }
    }

    canAcceptExtension(extension: string) {
        return extension == EPUB_FILE_EXTENSION;
    }

    getViewType() {
        return VIEW_TYPE_EPUB;
    }

    getIcon() {
        return ICON_EPUB;
    }
}
