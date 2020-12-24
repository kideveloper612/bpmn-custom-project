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

  let flag = false;
  let title = '';

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
  });

  // Add secondary toolbar
  let div = document.createElement("div");
  div.setAttribute("class", "secondary-bar");
  lanes.forEach(element => {
    let span = document.createElement("span");
    let spanNode = document.createTextNode(`${element.name}`);
    span.appendChild(spanNode);
    let button = document.createElement("button");
    button.appendChild(span);
    button.setAttribute("class", "bpmn-icon-user collapsible");
    button.setAttribute("title", `${element.name} Lane`);
    div.appendChild(button);

    let ul = document.createElement("div");
    element.children.forEach(subitem => {
      let li = document.createElement("div");
      const liText = document.createTextNode(`${subitem}`);
      li.appendChild(liText);
      li.setAttribute("class", "collapse-content");
      li.setAttribute("draggable", "true");
      li.ondragstart = (e) => {
        title = e.target.innerText;
        flag = true;
        var els = document.getElementsByClassName("collapse-content");
        Array.prototype.forEach.call(els, function(element){
          element.style.backgroundColor = null;
        });
        li.style.backgroundColor = "#666";
      };
      ul.appendChild(li);
    });
    ul.setAttribute("class", "collapse-group");
    div.appendChild(ul);
  });
  document.getElementsByClassName('bjs-container')[0].appendChild(div);

  var coll = document.getElementsByClassName("collapsible");
  for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
      this.classList.toggle("active");
      var contents = this.nextElementSibling.children;
      for (let index = 0; index < contents.length; index++) {
        const content = contents[index];
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
          content.style.margin = null;
        } else {
          content.style.maxHeight = 2 * content.scrollHeight + "px";
        }
      }
    });
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
