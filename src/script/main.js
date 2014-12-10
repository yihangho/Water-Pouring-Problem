var Visualization = React.createClass({
  getInitialState: function() {
    return {
      history: [[0,0]]
    };
  },
  getFutureNodes: function() {
    function pushIfNotExists(arr, node) {
      var notExists = arr.every(function(n) {
        return n[0] != node[0] || n[1] != node[1];
      });
      if (notExists) arr.push(node);
    }
    var X = this.props.cups[0], Y = this.props.cups[1];
    var currentVolumes = this.state.history[this.state.history.length - 1];
    var possibleVolumes = [];

    pushIfNotExists(possibleVolumes, [X, currentVolumes[1]]); // Fill X
    pushIfNotExists(possibleVolumes, [currentVolumes[0], Y]); // Fill Y
    pushIfNotExists(possibleVolumes, [0, currentVolumes[1]]); // Empty X
    pushIfNotExists(possibleVolumes, [currentVolumes[0], 0]); // Empty Y

    var newY = Math.min(Y, currentVolumes[0] + currentVolumes[1]);
    var newX = currentVolumes[0] - (newY - currentVolumes[1]);
    pushIfNotExists(possibleVolumes, [newX, newY]);

    var newX = Math.min(X, currentVolumes[0] + currentVolumes[1]);
    var newY = currentVolumes[1] - (newX - currentVolumes[0]);
    pushIfNotExists(possibleVolumes, [newX, newY]);

    // Remove those that have already explored
    possibleVolumes = possibleVolumes.filter(function(node) {
      return this.state.history.every(function(hist) {
        return hist[0] != node[0] || hist[1] != node[1];
      });
    }, this);

    return possibleVolumes;
  },
  appendHistory: function(newNode) {
    var currentHistory = this.state.history;
    currentHistory.push(newNode);
    this.setState({history: currentHistory});
  },
  undo: function() {
    var currentHistory = this.state.history;
    currentHistory.pop();
    this.setState({history: currentHistory});
  },
  componentDidUpdate: function() {
    var container      = this.refs.container.getDOMNode();
    var containerWidth = container.offsetWidth;
    var svgWidth       = this.refs.svg.props.width;

    if (svgWidth > containerWidth) {
      jQuery(container).animate({
        scrollLeft: svgWidth - containerWidth
      });
    }
  },
  render: function() {
    var svgWidth = Math.max(960, 100 + this.state.history.length * 100 + (this.state.history.length - 1) * 50);

    var historyNodes = this.state.history.map(function(node, i) {
      return (
        <HistoryNode value={ node } historyId={ i } key={ "history" + i } />
      );
    });

    var historyConnectors = [];
    for (var i = 0; i < this.state.history.length - 1; i++) {
      historyConnectors.push(
        <HistoryConnector connectorId={ i } key={ "historyConnector" + i } />
      );
    }

    var cx = 60 + (this.state.history.length - 1) * 150, cy = 140;

    var futureNodes = this.getFutureNodes().map(function(node, i, arr) {
      var mid   = (arr.length + 1) / 2;
      var angle = (i - mid + 1) * Math.PI / 5;
      return (
        <FutureNode value={ node } lastCX={ cx } lastCY={ cy } angle={ angle } key={ "future" + i } appendHistoryHandler={ this.appendHistory } />
      );
    }, this);

    var futureConnectors = this.getFutureNodes().map(function(node, i, arr) {
      var mid   = (arr.length + 1) / 2;
      var angle = (i - mid + 1) * Math.PI / 5;
      return (
        <FutureConnector lastCX={ cx } lastCY={ cy } angle={ angle } key={ "future" + i } />
      );
    });

    // this.refs.container.getDOMNode = 960 - svgWidth

    return (
      <div className="container" ref="container">
        <svg width={ svgWidth } height="280" ref="svg">
          { historyNodes }
          { historyConnectors }
          { futureNodes }
          { futureConnectors }
          <UndoButton parentHeight="280" parentWidth={ svgWidth } undoHandler={ this.undo } enabled={ this.state.history.length > 1 } />
        </svg>
      </div>
    );
  }
});

var HistoryNode = React.createClass({
  render: function() {
    var xCoordinate = 60 + this.props.historyId * 150;
    return (
      <g>
        <circle cx={ xCoordinate } cy="140" r="50" />
        <text x={ xCoordinate } y="145" textAnchor="middle">
          { "(" + this.props.value[0] + ", " + this.props.value[1] + ")" }
        </text>
      </g>
    );
  }
});

var HistoryConnector = React.createClass({
  render: function() {
    var x1 = 150 * this.props.connectorId + 110;
    var x2 = x1 + 50;

    return (
      <g>
        <line x1={ x1 } x2={ x2 } y1="140" y2="140" />
        <line x1={ x2 } x2={ x2 - 7.07 } y1="140" y2="132.93" />
        <line x1={ x2 } x2={ x2 - 7.07 } y1="140" y2="147.07" />
      </g>
    );
  }
});

var FutureNode = React.createClass({
  updateHistory: function() {
    this.props.appendHistoryHandler(this.props.value);
  },
  render: function() {
    var cx = this.props.lastCX + 105 * Math.cos(this.props.angle);
    var cy = this.props.lastCY + 105 * Math.sin(this.props.angle);

    return (
      <g className="clickable hoverable" onClick={ this.updateHistory }>
        <circle className="hoverable-target" cx={ cx } cy={ cy } r="25" />
        <text x={ cx } y={ cy + 5 } textAnchor="middle">
          { "(" + this.props.value[0] + ", " + this.props.value[1] + ")" }
        </text>
      </g>
    );
  }
});

var FutureConnector = React.createClass({
  render: function() {
    var x1 = this.props.lastCX + 50 * Math.cos(this.props.angle);
    var y1 = this.props.lastCY + 50 * Math.sin(this.props.angle);
    var x2 = this.props.lastCX + 80 * Math.cos(this.props.angle);
    var y2 = this.props.lastCY + 80 * Math.sin(this.props.angle);

    return (
      <g>
        <line x1={ x1 } x2={ x2 } y1={ y1 } y2={ y2 } />
      </g>
    );
  }
});

var UndoButton = React.createClass({
  render: function() {
    if (this.props.enabled) {
      return (
        <text className="clickable" x={ this.props.parentWidth - 45 } y={ this.props.parentHeight - 5 } onClick={ this.props.undoHandler }>
        Undo
        </text>
      );
    } else {
      return false;
    }
  }
});

var container = document.createElement("div");
container.className = "react-container";
document.body.appendChild(container);

function getVolumes(fn) {
  vex.dialog.open({
    input: '<input name="X" type="number" min="1" placeholder="Volume for Container 1 (e.g. 4)">' +
          '<input name="Y" type="number" min="1" placeholder="Volume for Container 2 (e.g. 9)">' +
          '<input name="target" type="number" min="0" placeholder="Target Volume (e.g. 1)">',
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, {
        text: 'Start'
      })
    ],
    callback: fn
  });
}

function render(data) {
  var containers = [parseInt(data.X) || 4, parseInt(data.Y) || 9];
  var target     = parseInt(data.target) || 1;

  React.render(
    <Visualization cups={ containers } target={ target } />,
    container
  );
}

getVolumes(render);
