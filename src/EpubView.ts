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


	private options = {
		flow: "paginated",
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


	getThemeFontColor() {
		// 获取obsidian渲染的标题的dom
		const titleElement = document.getElementsByClassName('view-header-title')[0]
		if (titleElement) {
			const rootStyles = getComputedStyle(titleElement);
			const propertyName = 'color'
			const fontColor = rootStyles.getPropertyValue(propertyName);
			console.log(`Current theme font color: ${fontColor}`);
			return fontColor;
		}
	}

	private path_currentLocation = "currentLocation.json"
	private locationMapFile = "epubLocationMap.json"

	/**
	 * 根据book的key生成hash值
	 * @param rendition epub渲染对象
	 * @returns 当前book的hash_key
	 */
	generateBookKey(rendition: ePub.Rendition) {
		return rendition.book.key()
		// const key = rendition.book.key();
		// return createHash("sha256").update(key, "utf-8").digest("hex")
	}

	getCfiForCurrentLocation(rendition: ePub.Rendition) {
		const location = rendition.currentLocation();
		return location.start.cfi;
	}
	saveyLocationForFile(rendition: ePub.Rendition) {
		const location = rendition.currentLocation();
		// 异步写入文件
		this.app.vault.adapter.write(this.path_currentLocation, JSON.stringify(location));
	}

	saveLocationMapToFile(rendition: ePub.Rendition) {
		const cfi = this.getCfiForCurrentLocation(rendition);
		// 存入map后持久化map
		// 先按照本书的key查找作为value的cfi
		const key = this.generateBookKey(rendition);
		//这是一段可能派得上用场的API OpenEpubPlugin.currentLocationMap.set(key, rendition.book.cfiFromPath(rendition.book.spine.get(rendition.book.spine.last().index).canonical));
		// 从本地文件读取map对象, 更新并写入
		this.makeLocationMapToFile(key, cfi);
	}

	async makeLocationMapToFile(key: string, cfi: string) {
		try {
			debugger
			const map = await this.getLocationMapFromFile();
			map.set(key, cfi);
			const toObj = Object.fromEntries(map);
			const cache = JSON.stringify(toObj);
			this.app.vault.adapter.write(this.locationMapFile, cache);
			console.log("save current location");
		} catch (err) {
			console.error("Error saving current location:", err);
		}

	}


	async getLocationForFile(): Promise<ePub.Location> {
		// 读取本地文件为Location对象
		return this.app.vault.adapter.read(this.path_currentLocation).then((content) => {
			return JSON.parse(content) as ePub.Location;
		});
	}
	// async getLocationMap(){
	// 	const content = await this.app.vault.adapter.read(this.path_currentLocation);

	async getLocationMapFromFile() {
		return this.app.vault.adapter.read(this.locationMapFile).then((content) => {
			const cache = JSON.parse(content);
			const backObj = Object.entries(cache)
			const localMap = new Map<string, string>(backObj);
			return localMap;
		}).catch((err) => {
			console.log(this.locationMapFile + "读取进度文件错误，创建新进度缓存对象");
			return new Map<string, string>();
		});
	}

	statDisplayForLocaltionFile(rendition: ePub.Rendition,) {
		this.getLocationForFile().then((location: ePub.Location) => {
			// console.log('location', location);
			// 判断location是不是内容为{}
			// display接受两种类型的参数，第一种字符串类型，是epub的cfi信息可以定位到章节的具体段落，第二种是数字类型可以定位到某个索引的章节
			if (Object.keys(location).length > 0 && Object.keys(location.start).length > 0) {
				const cfi = location.start.cfi;
				rendition.display(cfi);
			} else {
				rendition.display();
			}
			console.info('渲染完成：', location);
		}).catch((error) => {
			rendition.display();
			console.info(this.path_currentLocation + "读取失败执行初始渲染：", error);
		});
	}

	startDisplayForLocationMap(rendition: ePub.Rendition) {
		this.getLocationMapFromFile().then((map) => {
			const key = this.generateBookKey(rendition)
			debugger
			if (map.has(key)) {
				const cfi = map.get(key);
				rendition.display(cfi);
			} else {
				rendition.display();
			}
			console.debug('渲染完成：', map);
		}).catch((error) => {
			rendition.display();
			console.error(this.locationMapFile + '读取失败');
		});
	}

	async getCfiForLocation() {
		const l = await this.getLocationForFile();
		return l.start.cfi;
	}

	async onLoadFile(file: TFile): Promise<void> {
		console.log('loading epub view');
		this.contentEl.empty();

		const contents = await this.app.vault.adapter.readBinary(file.path);
		const book = ePub.default(contents);

		// // 满阅览视图渲染
		const viewElement = document.createElement('div');
		viewElement.id = book.opening.id;
		viewElement.style.width = '90%';
		viewElement.style.height = '100%';

		// const fontColor = this.getThemeFontColor();
		const rendition = book.renderTo(viewElement.id, this.options);
		// rendition.themes.register("styles", "styles.css");
		// rendition.themes.default({
		// 	body: { color: fontColor }
		// });

		// rendition.themes.default('./styles.css')

		// 设置上一页按钮
		this.prevButton.onclick = () => {
			rendition.prev();
			// 记录当前阅读进度
			this.saveyLocationForFile(rendition);
			this.saveLocationMapToFile(rendition);

		};

		// 设置下一页按钮
		this.nextButton.onclick = () => {
			rendition.next();
			// 记录当前阅读进度
			this.saveyLocationForFile(rendition);
			this.saveLocationMapToFile(rendition);
		};

		// TODO: 修改Epub字体颜色，可以尝试根据viewElement找到下属的#document嵌入式html的body标签，并修改css样式
		// 设置控件

		this.contentEl.style.display = 'flex';
		this.contentEl.appendChild(this.prevButton);
		this.contentEl.appendChild(viewElement);
		this.contentEl.appendChild(this.nextButton);


		// 开始渲染
		// this.statDisplayForLocaltionFile(rendition)
		debugger
		this.startDisplayForLocationMap(rendition)

		// const customCSS: CustomStyles = `
		// 	body {
		// 		font-family: Arial, sans-serif;
		// 		line-height: 1.5;
		// 	}
		// 	p {
		// 		color: #333;
		// 	}
		// 	h1 {
		// 		color: #0056b3;
		// 	}
		// `;

		// TODO： 似乎这个API可以在未来功能使用
		// rendition.on("renderer:chapter:change", (location: ePub.Location) => {})


		/**
		 * Defines a key listener function to handle keyboard navigation events.
		 * 
		 * This function is designed to respond to left and right arrow key events, triggering the previous or next page navigation function of the rendition.
		 * It uses the keyCode or which property of the event object to identify the pressed key.
		 * 
		 * @param e The event object, containing keyCode and which properties to identify the pressed key.
		 */
		// const keyListener = function (e: { keyCode: number; which: number; }) {
		// 	// Check if the left arrow key is pressed
		// 	// Left Key
		// 	if ((e.keyCode || e.which) == 37) {
		// 		rendition.prev();
		// 	}

		// 	// Check if the right arrow key is pressed
		// 	// Right Key
		// 	if ((e.keyCode || e.which) == 39) {
		// 		rendition.next();
		// 	}
		// };
		// rendition.on("keyup", keyListener);
		// document.addEventListener("keyup", keyListener, false);


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
