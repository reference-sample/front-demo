import { Boot } from '@wangeditor/editor';

// 用闭包保存回调函数
let onSaveCallback = null



class SaveMenu {
  constructor() {
    this.title = '保存内容'
    this.iconSvg = `<svg t="1756107642479" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5246" width="128" height="128"><path d="M870.4 0H153.6A153.6 153.6 0 0 0 0 153.6v716.8A153.984 153.984 0 0 0 153.6 1024h716.8A153.984 153.984 0 0 0 1024 870.4V153.6A153.6 153.6 0 0 0 870.4 0z m-96.32 71.296V432H249.984V71.296H774.08zM952.704 870.4a82.112 82.112 0 0 1-82.304 81.92H153.6a82.112 82.112 0 0 1-82.304-81.92V153.6c0-45.44 36.864-82.24 82.304-82.304h24.96V467.84a35.456 35.456 0 0 0 35.648 35.456h595.456a35.456 35.456 0 0 0 35.712-35.456V71.296H870.4c45.44 0 82.24 36.864 82.304 82.304v716.8zM649.6 355.456a35.84 35.84 0 0 0 35.648-35.84V172.608a35.712 35.712 0 0 0-71.36 0v147.008a35.84 35.84 0 0 0 35.584 35.84h0.128zM256 658.304h512a36.544 36.544 0 0 1 0 73.152H256a36.544 36.544 0 0 1 0-73.152z" p-id="5247"></path></svg>`
    this.tag = 'button'
  }

  getValue(editor) {
    return ''
  }

  isActive(editor) {
    return false
  }

  isDisabled(editor) {
    return false
  }

  exec(editor, value) {
    const html = editor.getHtml()
    const text = editor.getText()
    // 调用外部传入的保存逻辑
    if (onSaveCallback) {
      onSaveCallback(html, text, editor)
    } else {
      console.warn('SaveMenu: 未设置保存回调函数')
    }
  }
}

// 设置保存回调的静态方法
SaveMenu.setSaveHandler = (callback) => {
  if (typeof callback === 'function') {
    onSaveCallback = callback
  } else {
    console.warn('SaveMenu: save handler 必须是函数')
  }
}

const saveMenu = {
  key: 'custom-save',
  factory() {
    return new SaveMenu()
  }
}
Boot.registerMenu(saveMenu)
// 注册菜单（只注册一次）

export default SaveMenu