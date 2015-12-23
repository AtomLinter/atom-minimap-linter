'use babel';

export default {
  markerType: {
    type: 'string',
    default: 'highlight-over',
    enum: ['line', 'highlight-under', 'highlight-over', 'highlight-outline'],
    description: 'Marker type'
  }
};
