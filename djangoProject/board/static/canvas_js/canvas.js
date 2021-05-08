

// Ogarnianie websocketów.
var mouseDown = 0; // Zmienna potrzebna by erasy nie były bez kliknięcia
document.body.onmousedown = function () {
    ++mouseDown;
}
document.body.onmouseup = function () {
    --mouseDown;
}

const initCanvas = (id) => {
    var sizes = document.getElementById('canvas-content');

    var w = sizes.clientWidth;
    var h = sizes.offsetHeight;


    console.log("Expected width " + w + " Expected height " + h);
    return new fabric.Canvas(id, {
        width: w,
        height: h,
        selection: false
    });
}

setCanvasSize = () => {
    var sizes = document.getElementById('canvas-content');

    var w = sizes.clientWidth;
    var h = sizes.clientHeight;

    canvas.setDimensions({
        width: w,
        height: h,
    });

    canvas.renderAll();

    console.log("Expected width " + w + " Expected height " + h);
}

const setBackground = (url, canvas) => {
    fabric.Image.fromURL(url, (img) => {
        canvas.backgroundImage = img
        canvas.renderAll()
    })
}


const lockObject = (object, option) => {
    object.lockMovementX = object.lockMovementY = option;
    object.hasBorders = object.hasControls = !option;
}

const lockAddedObjectListener = (e) => {
    lockObject(e.target, true);
}
const lockAllObjects = (option) => {
    canvas.getObjects().forEach(object => {
        lockObject(object, option);
    });

    if (option) {
        canvas.on('object:added', lockAddedObjectListener)
    } else {
        canvas.off('object:added', lockAddedObjectListener)
    }
}

const endDrawingMode = (mode) => {
    if (mode === modes.drawing) {
        return
    } else {
        currentMode = ''
        canvas.isDrawingMode = false
        canvas.renderAll()
    }
}

const endMovindMode = (mode) => {
    if (mode === modes.move) {
        return
    } else {
        canObjectsMove = false
    }
}

const eraseHandler = (e) => {
    if (currentMode === modes.erase) {
        canvas.setCursor('default') // TODO i tak nie działa
        if (mouseDown) {
            canvas.remove(e.target)
        }
        canvas.requestRenderAll()
    }
}

const endErasingMode = (mode) => {
    if (mode === modes.erase) {
        return
    } else {
        console.log("ending erasing mode")
        canvas.setCursor('default')
        canvas.off('mouse:over', eraseHandler)
    }
}
const highlightButton = (mode) => {
    $('#mode-buttons').children().each(function () {
        var innerDivId = $(this).attr('id');
        console.log(innerDivId)
        if (innerDivId === mode) {
            $(this).addClass('active')
//            document.getElementById(innerDivId).focus();
//            document.getElementById(innerDivId).style.background('')
            console.log("Highlight - Kliknąłeś w: " + innerDivId)
        } else {
            $(this).removeClass('active')
            // document.getElementById(innerDivId).style.background='#F21314';
            console.log("Highlight - Nie kliknąłeś w: " + innerDivId);
        }
    });
}

const toggleMode = (mode) => {
    endDrawingMode(mode)
    endMovindMode(mode)
    endErasingMode(mode)
    highlightButton(mode)
    currentMode = mode
    if (mode === modes.pan) {
        lockAllObjects(true);
        canvas.renderAll()
    } else if (mode === modes.drawing) {
        canObjectsMove = false
        canvas.isDrawingMode = true
        canvas.renderAll()
    } else if (mode === modes.move) {
        lockAllObjects(false);
        canObjectsMove = true
    } else if (mode === modes.erase) {
        // TODO dodać kursor
        canvas.setCursor('grab')
        console.log("Erase mode on!\n");
        canvas.on("mouse:over", eraseHandler)
    }
}

const setPanEvents = (canvas) => {
    canvas.on('mouse:move', (event) => {
        // console.log(event)
        if (mousePressed && currentMode === modes.pan) {
            canvas.setCursor('grab')
            canvas.renderAll()
            const mEvent = event.e
            const delta = new fabric.Point(mEvent.movementX, mEvent.movementY)
            canvas.relativePan(delta)
        }
    })
    // keep track of mouse down/up
    canvas.on('mouse:down', (event) => {
        console.log("Mouse down!")
        mousePressed = true;
        if (currentMode === modes.pan) {
            canvas.setCursor('grab')
            canvas.renderAll()
        } else if (currentMode === modes.erase) {
            console.log("Clicked during erase mode!")
            canvas.remove(event.target) // TODO ogólnie to ta linijka sprawia, że po kliknięciu na obiekt jest usuwany.
            // canvas.requestRenderAll()                   // Jest to fajna opcja ale nie umiem zrobić tak, by kursor nie był typu 'change size' podczas
            // najeżdżania. Może więc warto to usunąć
        } else if (currentMode === modes.rectangle) {
            console.log("Create rectangle!")
            var pointer = canvas.getPointer(event.e);
            createRect(canvas, pointer.x, pointer.y)
        } else if (currentMode === modes.circle) {
            console.log("Create circle!")
            var pointer = canvas.getPointer(event.e);
            createCirc(canvas, pointer.x, pointer.y)
        } else if (currentMode === modes.text) {
            console.log("Create textbox!")
            var pointer = canvas.getPointer(event.e);
            createTextbox(canvas, pointer.x, pointer.y)
        }
    })
    canvas.on('mouse:up', (event) => {
        mousePressed = false
        canvas.setCursor('default')
        canvas.renderAll()
    })
    // zoom in and out of canvas
    canvas.on('mouse:wheel', (event) => {
        var delta = event.e.deltaY;
        delta /= 3 // Ta linijka zmniejsza tempo scrollowania
        var zoom = canvas.getZoom();
        zoom *= 0.97 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({x: event.e.offsetX, y: event.e.offsetY}, zoom);
        event.e.preventDefault();
        event.e.stopPropagation();
    })
}


const setColorListener = () => {
    const picker = document.getElementById('colorPicker')
    picker.addEventListener('change', (event) => {
        console.log("setColorListener " + event.target.value)
        canvas.freeDrawingBrush.color = event.target.value
        canvas.requestRenderAll()
    })
}

// Moze jakos inaczej nazwac ten event - nie znam konwencji :/
// Jest git :) //
const setBrushSizeListener = () => {
    const brushSize = document.getElementById('brushSize')
    brushSize.addEventListener('change', (event) => {
        console.log("setBrushSizeListener" + event.target.value)
        canvas.freeDrawingBrush.width = parseInt(event.target.value, 10)
        canvas.requestRenderAll()
    })
}

const clearCanvas = (canvas, state) => {
    state.val = canvas.toJSON()
    canvas.getObjects().forEach((o) => {
        if (o !== canvas.backgroundImage) {
            canvas.remove(o)
        }
    })
}

const restoreCanvas = (canvas, state, bgUrl) => {
    if (state.val) {
        canvas.loadFromJSON(state.val)
    }
}

const changeRectMode = () => {
    currentMode = modes.rectangle
}

const changeCircMode = () => {
    currentMode = modes.circle
}

const changeTextMode = () => {
    currentMode = modes.text
}

const createRect = (canvas, left = 100, top = 100) => {
    console.log("rect")
    currentMode = ''
    const canvCenter = canvas.getCenter()
    rect = new fabric.Rect({
        width: 100,
        height: 100,
        fill: 'green',
        //left: canvCenter.left,
        left: left,
        // top: canvCenter.top,
        top: top,
        originX: 'center',
        originY: 'center',
        cornerColor: 'white'
    })
    canvas.add(rect)
    canvas.renderAll()
}

const createCirc = (canvas, left = 100, top = 100) => {
    console.log("circ")
    currentMode = ''
    const canvCenter = canvas.getCenter()
    circle = new fabric.Circle({
        radius: 50,
        fill: 'orange',
        //left: canvCenter.left,
        left: left,
        // top: canvCenter.top,
        top: top,
        originX: 'center',
        originY: 'center',
        cornerColor: 'white'
    })
    canvas.add(circle)
    canvas.renderAll()
}

const createTextbox = (canvas, left = 100, top = 100) => {
    console.log("text")
    currentMode = ''
    const canvCenter = canvas.getCenter()
    textbox = new fabric.Textbox('Type here', {
        //left: canvCenter.left,
        left: left,
        // top: canvCenter.top,
        top: top,
        width: 100,
        height: 100,
        originX: 'center',
        originY: 'center',
        fill: '#000000'
    })
    canvas.add(textbox)
    canvas.renderAll()
}


const groupObjects = (canvas, group, shouldGroup) => {
    if (shouldGroup) {
        const objects = canvas.getObjects()
        group.val = new fabric.Group(objects, {cornerColor: 'white'})
        clearCanvas(canvas, JSONState)
        canvas.add(group.val)
        canvas.requestRenderAll()
    } else {
        group.val.destroy()
        let oldGroup = group.val.getObjects()
        clearCanvas(canvas, JSONState)
        canvas.add(...oldGroup)
        group.val = null
        canvas.requestRenderAll()
    }
}

const imgAdded = (e) => {
    console.log(e)
    const inputElem = document.getElementById('myImg')
    const file = inputElem.files[0];
    reader.readAsDataURL(file)
}

const operationTypes = {
    modify: 'M', add: 'A', remove: 'R'
}

document.addEventListener('keydown', function (e) {
    console.log("You pressed" + e.key);
    if (e.ctrlKey && e.key === 'z') {
        undo()
        console.log("ctrl z pressed!\n");
    } else if (e.ctrlKey && e.key === 'y') {
        console.log("ctrl y pressed!\n")
        redo();
    }
})


const canvas = initCanvas('canvas')

const boardPK = JSON.parse(document.getElementById('board-pk').textContent);

console.log("boardPK = " + boardPK)

const boardSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/board/'
    + boardPK
    + '/'
);

boardSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    console.log("On message called!")
}


const JSONState = {}
let mousePressed = false
let color = '#000000'
const group = {}
const bgUrl = 'https://cdn.pixabay.com/photo/2017/03/17/19/37/sky-2152463_960_720.jpg'

let currentMode;

const modes = {
    pan: 'pan',
    drawing: 'drawing',
    move: 'move',
    erase: 'erase',
    text: 'text',
    rectangle: 'rectangle',
    circle: 'circle'
}
toggleMode(modes.move) // default mode

const reader = new FileReader()

class EraseCommand {
    constructor(target) {
        this.target = target
        this.type = operationTypes.remove
    }

    undo(canvas) {
        canvas.add(this.target)
        canvas.requestRenderAll()
    }

    execute(canvas) {
        canvas.remove(this.target)
        canvas.requestRenderAll()
    }
}

class AddCommand {
    constructor(target) {
        this.target = target
        this.type = operationTypes.add
    }

    undo(canvas) {
        canvas.remove(this.target)
        canvas.requestRenderAll()
    }

    execute(canvas) {
        canvas.add(this.target)
        canvas.requestRenderAll()
    }
}

var undo_stack = []
var redo_stack = []
is_redoing = false
should_push = true

function undo() {
    if (undo_stack.length === 0)
        return
    let op = undo_stack.pop()
    redo_stack.push(op)
    should_push = false
    op.undo(canvas)
    should_push = true

}

function redo() {
    is_redoing = true
    if (redo_stack.length === 0)
        return
    const op = redo_stack.pop();

    op.execute(canvas)
}


canvas.on("object:added", (e) => {
    if (should_push) {
        if (!is_redoing) {
            redo_stack = []
        }
        is_redoing = false
        undo_stack.push(new AddCommand(e.target))
    }

});

canvas.on("object:modified", (e) => {
    var object = e.target
    object.saveState()
    console.log(e.target)
})

canvas.on("object:removed", e => {
    if (should_push) {
        if (!is_redoing) {
            redo_stack = []
        }
        is_redoing = false
        undo_stack.push(new EraseCommand(e.target))
    }

})

setColorListener()
setBrushSizeListener()
setBackground(bgUrl, canvas)
setPanEvents(canvas)
window.addEventListener("resize", setCanvasSize);

const inputFile = document.getElementById('myImg');
inputFile.addEventListener('change', imgAdded)

reader.addEventListener("load", () => {
    fabric.Image.fromURL(reader.result, img => {
        canvas.add(img)
        canvas.requestRenderAll()

    })
})
