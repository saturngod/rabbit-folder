class UI {
    constructor(api) {
        this.api = api

        this.textChooseFolder = document.querySelector('#text-choose-folder')
        this.textSourceFolderPath = document.querySelector('#text-source-folder-path')
        this.textError = document.querySelector('#text-error')
    
        this.btnConvert = document.querySelector('#btn-convert')
        this.btnChooseTargetFolder = document.querySelector('#btn-choose-target-folder')

        this.sponsor = document.querySelector('.sponsor img')
    
        this.dropZone = document.querySelector('#drop-zone')
        this.textErrorHidden = true
    
        this.init()

        this.errors = [
            'Source path can\'t be empty.',
            'Target path can\'t be empty.',
            'Source and target path can\'t be the same.'
        ]
    }

    showSuccessStatus() {
        this.sourceFolderPath = ''
        this.targetFolderPath = ''
        this.error = null
        this.conversionInProgress = false

        this.btnConvert.classList.remove('btn-default')
        this.btnConvert.classList.remove('disabled')
        this.btnConvert.classList.add('btn-success')
        this.btnConvert.innerText = 'Success!'

        setTimeout(() => {
            this.btnConvert.classList.add('btn-default')
            this.btnConvert.classList.remove('btn-success')
            this.btnConvert.classList.add('disabled')

            this.btnConvert.textContent = this.btnConvert.getAttribute('data-default')
        }, 1500)
    }

    set conversionInProgress(value) {
        this._conversionInProgress = !!value

        if (!!value) {
            this.btnConvert.textContent = 'Converting ...'
            this.btnConvert.disabled = true
            this.btnConvert.classList.add('disabled')
        }
    }

    get conversionInProgress() {
        return this._conversionInProgress
    }

    set error(errorType) {
        if (errorType === null) {
            this.textError.textContent = ''
            this.textErrorHidden = true
            this.textError.classList.add('hidden')

            return
        }
        let errorText = this.errors[errorType]
        this.textError.classList.remove('hidden')
        this.textError.textContent = errorText || 'Something went wrong!'
        this.textErrorHidden = false
    }

    set btnConvertDisabled(value) {
        this.btnConvert.disabled = value
        if (!value) {
            this.btnConvert.classList.remove('disabled')
        } else {
            this.btnConvert.classList.add('disabled')
        }
    }

    refreshErrorTextState() {
        let sourcePath = this.api.getPath()
        let targetPath = this.api.getPath(false)

        if (!!sourcePath && !!targetPath && sourcePath === targetPath) {
            this.error = UI.Errors.SOURCE_EQ_TARGET

            return
        }

        this.textError.classList.add('hidden')
        this.textError.textContent = ''
        this.textErrorHidden = true
    }

    refreshBtnConvertState() {
        let sourcePath = this.api.getPath()
        let targetPath = this.api.getPath(false)
        let isSourcePathEmpty = !!!sourcePath
        let isTargetPathEmpty = !!!targetPath
        let isSourceEqTargetPath = !isSourcePathEmpty && !isTargetPathEmpty && sourcePath === targetPath

        this.btnConvertDisabled = isSourcePathEmpty || isTargetPathEmpty || isSourceEqTargetPath
    }

    set sourceFolderPath(value) {
        this.api.setPath(value)
        this.refreshBtnConvertState()
        this.refreshErrorTextState()

        if (!!!value) {
            this.textChooseFolder.classList.remove('hidden')
            this.textSourceFolderPath.classList.add('hidden')

            this.textSourceFolderPath.textContent = this.textSourceFolderPath.getAttribute('data-default')
            return
        }

        this.textChooseFolder.classList.add('hidden')
        this.textSourceFolderPath.classList.remove('hidden')
        this.textSourceFolderPath.textContent = value
    }

    set targetFolderPath(value) {
        this.api.setPath(value, false)
        this.refreshBtnConvertState()
        this.refreshErrorTextState()

        this.btnChooseTargetFolder.textContent = !!value ? this.api.getBaseName(value) : this.btnChooseTargetFolder.getAttribute('data-default')
    }

    showDropZoneError() {
        this.dropZone.classList.remove('dropper-dragover')
        this.dropZone.classList.add('dropper-error')

        setTimeout(() => {
            this.dropZone.classList.remove('dropper-error')
        }, 2000);
    }

    toggleDropZoneDragEnter(remove = false) {
        if (remove) {
            this.dropZone.classList.remove('dropper-dragover')
            this.dropZone.classList.remove('dropper-error')
        } else {
            this.dropZone.classList.remove('dropper-error')
            this.dropZone.classList.add('dropper-dragover')
        }
    }
}

UI.prototype.init = function() {
    this.dropEnabled = true

    this.dropZone.addEventListener('dragover', e => {
        e.preventDefault()
        e.stopPropagation()
    })
    this.dropZone.addEventListener('dragenter', _ => this.toggleDropZoneDragEnter())
    this.dropZone.addEventListener('dragleave', _ => this.toggleDropZoneDragEnter(true))
    this.dropZone.addEventListener('drop', this.dropZoneDropEventHandler.bind(this))
    this.dropZone.addEventListener('click', this.openSourceFolder.bind(this))

    this.btnChooseTargetFolder.addEventListener('click', this.openTargetFolder.bind(this))
    this.btnChooseTargetFolder.addEventListener('mouseover', this.showFullTargetPath.bind(this))
    this.btnChooseTargetFolder.addEventListener('mouseleave', this.showBasenameTargetPath.bind(this))

    this.btnConvert.addEventListener('click', this.convert.bind(this))

    this.sponsor.addEventListener('click', _ => this.api.openSponsorLink())
}

UI.prototype.convert = function() {
    this.api.convert()
}

UI.prototype.openSourceFolder = async function() {
    if (this.conversionInProgress) return

    this.sourceFolderPath = await this.api.openFolder()
}

UI.prototype.openTargetFolder = async function() {
    if (this.conversionInProgress) return

    this.targetFolderPath = await this.api.openFolder()
}

UI.prototype.showFullTargetPath = function() {
    let targetFolderPath = this.api.getPath(false)

    if (!!targetFolderPath)
        this.btnChooseTargetFolder.textContent = targetFolderPath

    if (!this.textErrorHidden) this.textError.classList.add('hidden')
}

UI.prototype.showBasenameTargetPath = function() {
    let targetFolderPath = this.api.getPath(false)

    if (!!targetFolderPath)
        this.btnChooseTargetFolder.textContent = this.api.getBaseName(targetFolderPath)

    if (this.textErrorHidden) this.textError.classList.add('hidden')
    else this.textError.classList.remove('hidden')
}

UI.prototype.dropZoneDropEventHandler = function(event) {
    event.preventDefault()
    event.stopPropagation()
    if (this.conversionInProgress) return
    
    if (event.dataTransfer.files.length <= 0) return

    let file = event.dataTransfer.files[0]
    let transferItem = event.dataTransfer.items[0].webkitGetAsEntry()

    if (!transferItem.isDirectory) {
        this.sourceFolderPath = ''
        return this.showDropZoneError()
    }

    this.toggleDropZoneDragEnter(true)
    this.sourceFolderPath = file.path
}

UI.Errors = {
    SOURCE_EMPTY: 0,
    TARGET_EMPTY: 1,
    SOURCE_EQ_TARGET: 2
}