import { WorkspaceLeaf, FileView, TFile } from "obsidian";
// import { createHash } from "crypto";
import { OpenEpubPluginSettings } from "./OpenEpubPluginSettings";
import * as ePub from 'epubjs';


export const EPUB_FILE_EXTENSION = "epub";
export const VIEW_TYPE_EPUB = "epub";
export const ICON_EPUB = "doc-epub";

export class EpubView extends FileView {


	// allowNoFile = false;
	private previousButtonId = 'previous';
	private nextButtonId = 'next';
	public fontColor: string;
	public rendition: ePub.Rendition;


	private options = {
		flow: "paginated",
		width: "100%",
		height: "100%"
	}

	private prevButton = document.createElement('button');
	private nextButton = document.createElement('button');

	constructor(leaf: WorkspaceLeaf, private settings: OpenEpubPluginSettings) {
		super(leaf);
		this.initButton();
	}


	private initButton(){
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

	getGlobalFontColor() {
		// 获取obsidian文本颜色css变量
		const bodyStyle = window.getComputedStyle(document.body);
		const textNormalValue = bodyStyle.getPropertyValue('--text-normal');
		// console.log(textNormalValue);  // 输出 '--text-normal' 的值，例如：'rgb(135, 135, 135)'
		return textNormalValue
	}
	
	// TODO: 改为配置面板配置，路径默认为.epubLocationMap.json
	private locationMapFile = "epubLocationMap.json"

	/**
	 * 根据book的key生成hash值
	 * @param rendition epub渲染对象
	 * @returns 当前book的hash_key
	 */
	private async generateBookKey(rendition: ePub.Rendition) {
		return rendition.book.ready.then(() => {
			return rendition.book.key();
		})
	}

	private getCfiFromCurrentLocation(rendition: ePub.Rendition) {
		const location = rendition.currentLocation();
		return location.start.cfi;
	}


	private saveLocationMapToFile(rendition: ePub.Rendition) {
		const cfi = this.getCfiFromCurrentLocation(rendition);
		// 存入map后持久化map
		// 先按照本书的key查找作为value的cfi
		this.generateBookKey(rendition).then((key) => {
			// 从本地文件读取map对象, 更新并写入
			this.makeLocationMapToFile(key, cfi);
		})
		//这是一段可能派得上用场的API OpenEpubPlugin.currentLocationMap.set(key, rendition.book.cfiFromPath(rendition.book.spine.get(rendition.book.spine.last().index).canonical));
	}

	private async makeLocationMapToFile(key: string, cfi: string) {
		try {
			const map = await this.getLocationMapFromFile();
			map.set(key, cfi);
			const toObj = Object.fromEntries(map);
			const cache = JSON.stringify(toObj);
			this.app.vault.adapter.write(this.locationMapFile, cache);
		} catch (err) {
			console.error("Error saving current location:", err);
		}
	}

	private async getLocationMapFromFile() {
		return this.app.vault.adapter.read(this.locationMapFile).then((content) => {
			const cache = JSON.parse(content);
			const backObj = Object.entries(cache)
			const localMap = new Map<string, string>(backObj);
			return localMap;
		}).catch((err) => {
			console.log(this.locationMapFile + "读取进度文件错误，创建新进度缓存对象: ", err);
			return new Map<string, string>();
		});
	}

	private startDisplayForLocationMap(rendition: ePub.Rendition) {
		this.getLocationMapFromFile().then((map) => {
			this.generateBookKey(rendition).then((key) => {
				if (map.has(key)) {
					const cfi = map.get(key);
					rendition.display(cfi);
				} else {
					rendition.display();
				}
			});
		}).catch((error) => {
			rendition.display();
			console.error(this.locationMapFile + '读取失败: ', error);
		});
	}


	private next(rendition: ePub.Rendition) {
		rendition.next();
		this.saveLocationMapToFile(rendition);
	}
	private prev(rendition: ePub.Rendition) {
		rendition.prev();
		this.saveLocationMapToFile(rendition);
	}

	private fillContentEl(contentEl: HTMLElement, viewElement: HTMLElement, rendition: ePub.Rendition) {

		viewElement.style.width = '90%';
		viewElement.style.height = '100%';

		// 设置上一页按钮
		this.prevButton.onclick = () => {
			this.prev(rendition);
			this.saveLocationMapToFile(rendition);
		};

		// 设置下一页按钮
		this.nextButton.onclick = () => {
			this.next(rendition);
			this.saveLocationMapToFile(rendition);
		};

		// 设置控件
		this.contentEl.style.display = 'flex';
		this.contentEl.appendChild(this.prevButton);
		this.contentEl.appendChild(viewElement);
		this.contentEl.appendChild(this.nextButton);
	}

	/**
	 * Defines a key listener function to handle keyboard navigation events.
	 * 
	 * This function is designed to respond to left and right arrow key events, triggering the previous or next page navigation function of the rendition.
	   * It uses the keyCode or which property of the event object to identify the pressed key.
	 * 
	 * @param e The event object, containing keyCode and which properties to identify the pressed key.
	 * @param rendition The rendition object, used to trigger the previous or next page navigation function.
	 */
	keyPageTurning(e: { keyCode: number; which: number; }, rendition: ePub.Rendition) {
		// Check if the left arrow key is pressed
		// Left Key
		if ((e.keyCode || e.which) == 37) {
			// this.prev(rendition);
			rendition.prev();
			this.saveLocationMapToFile(rendition);
		}
		// Check if the right arrow key is pressed
		// Right Key
		if ((e.keyCode || e.which) == 39) {
			rendition.next();
			this.saveLocationMapToFile(rendition);
		}
	}

	private setDefaultTheme(rendition: ePub.Rendition) {
		const fontColor = this.getGlobalFontColor()
		// 存储到对象中，等到主题变更时对比
		this.fontColor = fontColor
		rendition.themes.default({
			body: { color: fontColor }
		});
	}

	public updateTheme(rendition: ePub.Rendition, fontColor: string) {
		rendition.themes.override("color", fontColor);
		this.fontColor = fontColor
	}

	async onLoadFile(file: TFile): Promise<void> {
		this.contentEl.empty();

		const contents = await this.app.vault.adapter.readBinary(file.path);
		const book = ePub.default(contents);

		// // 满阅览视图渲染
		const viewElement = document.createElement('div');
		viewElement.id = book.opening.id;
		const rendition = book.renderTo(viewElement.id, this.options);
		this.rendition = rendition
		// 填充Obsidian分配的contentEl
		this.fillContentEl(this.contentEl, viewElement, rendition);

		// TODO: 修改Epub字体颜色，可以尝试根据viewElement找到下属的#document嵌入式html的body标签，并修改css样式
		this.setDefaultTheme(rendition);

		// 开始渲染
		// this.statDisplayForLocaltionFile(rendition)
		this.startDisplayForLocationMap(rendition)

		const keyListener = this.keyPageTurning.bind(this, rendition);
		rendition.on("keyup", keyListener);
		document.addEventListener("keyup", keyListener, false);
		return super.onLoadFile(file);
	}
	onunload(): void {
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
