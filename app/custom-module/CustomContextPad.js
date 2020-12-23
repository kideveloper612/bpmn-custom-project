const SUITABILITY_SCORE_HIGH = 100,
      SUITABILITY_SCORE_AVERGE = 50,
      SUITABILITY_SCORE_LOW = 25;

export default class CustomContextPad {
  constructor(bpmnFactory, config, contextPad, create, elementFactory, injector, modeling, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;
    this.modeling = modeling;

    if (config.autoPlace !== false) {
      this.autoPlace = injector.get('autoPlace', false);
    }

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const {
      autoPlace,
      bpmnFactory,
      create,
      elementFactory,
      translate,
      modeling
    } = this;

    function appendServiceLane(suitabilityScore) {
      return function(event, element) {
        if (autoPlace) {
          const businessObject = bpmnFactory.create('bpmn:Lane');
    
          businessObject.suitable = suitabilityScore;
    
          const shape = elementFactory.createShape({
            type: 'bpmn:Lane',
            businessObject: businessObject
          });
    
          autoPlace.append(element, shape);
        } else {
          appendServiceLaneStart(event, element);
        }
      }
    }

    function appendServiceLaneStart(suitabilityScore) {
      return function(event) {
        const businessObject = bpmnFactory.create('bpmn:Lane');

        businessObject.suitable = suitabilityScore;
        console.log(businessObject);

        const shape = elementFactory.createShape({
          type: 'bpmn:Lane',
          businessObject: businessObject
        });

        create.start(event, shape, element);
      }
    }

    return {
      'append.low-lane': {
        group: 'model',
        className: 'bpmn-icon-lane red',
        title: translate('Append Lane with low suitability score'),
        action: {
          click: appendServiceLane(SUITABILITY_SCORE_LOW),
          dragstart: appendServiceLaneStart(SUITABILITY_SCORE_LOW)
        }
      },
      'append.average-lane': {
        group: 'model',
        className: 'bpmn-icon-lane yellow',
        title: translate('Append Lane with average suitability score'),
        action: {
          click: appendServiceLane(SUITABILITY_SCORE_AVERGE),
          dragstart: appendServiceLaneStart(SUITABILITY_SCORE_AVERGE)
        }
      },
      'append.high-lane': {
        group: 'model',
        className: 'bpmn-icon-lane green',
        title: translate('Append Lane with high suitability score'),
        action: {
          click: appendServiceLane(SUITABILITY_SCORE_HIGH),
          dragstart: appendServiceLaneStart(SUITABILITY_SCORE_HIGH)
        }
      }
    };
  }
}


CustomContextPad.$inject = [
  'bpmnFactory',
  'config',
  'contextPad',
  'create',
  'elementFactory',
  'injector',
  'modeling',
  'translate'
];