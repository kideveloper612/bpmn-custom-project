import $ from 'jquery';

import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/newDiagram.bpmn';
import lanes from './custom/lanes.json';
var container = $('#js-drop-zone');

var modeler = new BpmnModeler({
  container: '#js-canvas',
  keyboard: {
    bindTo: document
  },
});

function createNewDiagram() {
  openDiagram(diagramXML);
}

function openDiagram(xml) {

  modeler.importXML(xml, function (err) {

    if (err) {
      container
        .removeClass('with-diagram')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-diagram');
    }

  });

}

function saveSVG(done) {
  modeler.saveSVG(done);
}

function saveDiagram(done) {

  modeler.saveXML({ format: true }, function (err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;
    if (files.length === 0) {
      return;
    }

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function (e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function () {

  $('#js-create-diagram').click(function (e) {
    e.stopPropagation();
    e.preventDefault();
    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  $('.buttons a').click(function (e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function () {

    saveSVG(function (err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function (err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  modeler.on('commandStack.changed', exportArtifacts);

  var eventBus = modeler.get('eventBus');
  var directEditing = modeler.get('directEditing');

  eventBus.on('element.dblclick', 10000, function (context) {
    var element = context.element,
      businessObject = element.businessObject;

    if (businessObject.name === 'aaaa') {
      return false; // will cancel event
    }
  });

  // Set variables for drag and drop title
  let flag = false;
  let title = '';

  // Put title of lane using drag and drop
  eventBus.on('element.hover', 1000, function (context) {

    if (flag === true && context.element.type === 'bpmn:Lane') {
      directEditing.activate(context.element);
      const currentTitle = directEditing.getValue();

      if (currentTitle !== "") {
        directEditing._textbox.destroy();
        directEditing.complete();
        directEditing.activate(context.element);
      }

      directEditing._textbox.insertText(title);
      directEditing.complete();

    }

    flag = false;

    // Selectable Lane
    const rects = document.querySelectorAll('.djs-group .djs-element.djs-shape[data-element-id^="Lane"] rect.djs-outline');
    Array.prototype.forEach.call(rects, function (element) {
      element.classList.add("djs-hit-all");
    });
  });

  // Add secondary toolbar
  let div = document.createElement("div");
  div.setAttribute("class", "secondary-bar");

  lanes.forEach((element, index) => {

    let listBox = document.createElement("ul");
    let span = document.createElement("span");
    let spanNode = document.createTextNode(`${element.name}`);
    
    span.appendChild(spanNode);
    
    let listHead = document.createElement("li");

    listHead.appendChild(span);

    if (index === 0) {
      listBox.setAttribute("class", "users-list");
      listHead.setAttribute("class", "list-head bpmn-icon-user");
    }
    else if (index === 1) {
      listBox.setAttribute("class", "groups-list"); 
      listHead.setAttribute("class", "list-head bpmn-icon-script-task");
    }
    else {
      listBox.setAttribute("class", "roles-list");
      listHead.setAttribute("class", "list-head bpmn-icon-intermediate-event-catch-non-interrupting-timer");
    }

    listHead.setAttribute("title", `${element.name} Lane`);
    listBox.appendChild(listHead);

    element.children.forEach(item => {
      let listItem = document.createElement("li");

      listItem.setAttribute("class", "list-item");

      const listText = document.createTextNode(`${item}`);
      
      listItem.appendChild(listText);
      listItem.setAttribute("draggable", "true");

      listItem.ondragstart = (e) => {
        title = e.target.innerText;
        flag = true;

        var els = document.getElementsByClassName("list-item");
        Array.prototype.forEach.call(els, function (element) {
          element.style.backgroundColor = null;
        });

        listItem.style.backgroundColor = "#999";
      };

      listBox.appendChild(listItem);
    });

    div.appendChild(listBox);

  });

  document.getElementsByClassName('bjs-container')[0].appendChild(div);

  // Reset the position of Secondary Toolbar
  const twoColumn = document.querySelector(".djs-palette.two-column.open");
  if (twoColumn) {
    document.getElementsByClassName("secondary-bar")[0].style.left = "116px";
  }
});

// helpers //////////////////////

function debounce(fn, timeout) {

  var timer;

  return function () {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}
