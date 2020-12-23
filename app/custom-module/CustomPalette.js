const SUITABILITY_SCORE_HIGH = 100,
      SUITABILITY_SCORE_AVERGE = 50,
      SUITABILITY_SCORE_LOW = 25;

export default class CustomPalette {
  constructor(bpmnFactory, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const {
      bpmnFactory,
      create,
      elementFactory,
      translate
    } = this;

    function createLane(suitabilityScore) {
      return function(event) {
        const businessObject = bpmnFactory.create('bpmn:Lane');
  
        businessObject.suitable = suitabilityScore;
  
        const shape = elementFactory.createShape({
          type: 'bpmn:Lane',
          businessObject: businessObject
        });
  
        create.start(event, shape); 
      }
    }

    return {
      'create.low-task': {
        group: 'activity',
        className: 'bpmn-icon-lane red',
        title: translate('Create Task with low suitability score'),
        action: {
          dragstart: createLane(SUITABILITY_SCORE_LOW),
          click: createLane(SUITABILITY_SCORE_LOW)
        }
      },
      'create.average-task': {
        group: 'activity',
        className: 'bpmn-icon-lane yellow',
        title: translate('Create Task with average suitability score'),
        action: {
          dragstart: createLane(SUITABILITY_SCORE_AVERGE),
          click: createLane(SUITABILITY_SCORE_AVERGE)
        }
      },
      'create.high-task': {
        group: 'activity',
        className: 'bpmn-icon-lane green',
        title: translate('Create Task with high suitability score'),
        action: {
          dragstart: createLane(SUITABILITY_SCORE_HIGH),
          click: createLane(SUITABILITY_SCORE_HIGH)
        }
      }
    }
  }
}

CustomPalette.$inject = [
  'bpmnFactory',
  'create',
  'elementFactory',
  'palette',
  'translate'
];