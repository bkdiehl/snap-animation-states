var SnapStates = (function(options) {
	'use strict';

	var _this,
		_counter = 1, //counter is used to give unique id's
		_defaults = {
			easing: mina.easeinout,
		};

	options.easing 		= options.easing || _defaults.easing;

	_this = document.querySelectorAll(options.selector);

	// add style to head to negate round path ending artifacts in IE, Edge, FireFox
	var style = document.getElementById('svg-path');
	if(!style) {
		var head = document.getElementsByTagName('head')[0];
		
		style = document.createElement('style');
		style.id = "svg-path";
		style.innerHTML = 'svg path { stroke-linecap: butt; }';
		head.appendChild(style);
	}
	
	
	//listens for changes in the dom to see if the plugin should be re-run
	var observer = new MutationObserver(function(mutations) {
		var elems = document.querySelectorAll(options.selector);
		if(_this.length != elems.length) {
			_this = document.querySelectorAll(options.selector);
			animationStateMethods.loopThroughIcons(_this, options, _counter)
		}
	});
	observer.observe(document.body, { childList:true, subtree:true, attributes:false })
	
	//make sure the svg is actually used on the dom
	if(_this.length === 0) return;

	//loop through all plugins existent on the dom
	animationStateMethods.loopThroughIcons(_this, options, _counter)
});







/****************************************************************
					  		Methods
*****************************************************************/
var animationStateMethods = {
	loopThroughIcons:function(_this, options, _counter){
		return [].forEach.call(_this, function(el, i) {
			//create instance of SvgSchema
			var schema = new SvgSchema(el, options);

			if(_this.length > 1 && el.className && !schema.duplicate) {
				schema.elem.id = schema.selectorName + "_" + _counter;
				_counter++;
			}


			/*
				3 Ways this app can reference an svg
				1. Load the svg using a file reference (ex. svg: "../images/someFile.svg")
				2. Load the svg to the dom using an inline svg found in the schema
				3. The selector is attached to an inline svg already found on the dom
				*/
			if(schema.svg) {
				var end = schema.svg.slice(-4);
				if(end == ".svg") {
					//load the svg using a file reference and Snap
					var s = schema.elem.id ? Snap("#" + schema.elem.id) : Snap('.' + schema.selectorName);
					Snap.load(schema.svg, function(loadedFragment) {
						if(!schema.elem.innerHTML) s.append(loadedFragment); //load svg to dom if elem is still empty
						animationStateMethods.organizeStates(schema);
					});
				} else {
					schema.elem.innerHTML = schema.svg;
					animationStateMethods.organizeStates(schema);
				}
			} else animationStateMethods.organizeStates(schema);
			if(!schema.states) return;

			if(schema.events instanceof Array) {
				for(var i = 0; i < schema.events.length; i ++) {
					var triggerElem = animationStateMethods.setTriggerElement(i, schema);
					animationStateMethods.setTriggerEvent(i, schema, triggerElem);
				}
			}

			
		});
	},


	organizeStates: function(schema) {
		var states = schema.states;
		if(!states) return;

		var elem = schema.elem,
			active = schema.active,
			start = schema.start,
			animations = schema.animations;

		schema.setActiveStates();

		for(var state in states) {
			var transforms = states[state];
			if(transforms && transforms.length > 0) {
				this.transformsLoop(transforms, elem, start, schema, state);		
				this.setStatesToAnimation(animations, state, start, elem, active);
				if(schema.initState == state) {
					active[state] = true; //set the initial active state to true
					animations[state]();
				}
			}
		}
	},


	transformsLoop: function(transforms, elem, start, schema, state) {

		start[state] = [];
		var transformArr = [];

		transforms.forEach(function(t) {
			var transform = new Transform(t, schema),
				matrix = schema.matrix;

			if(!matrix[transform.matrixElem]) matrix[transform.matrixElem] = {};
			
			if(!transform.id && !transform.waitFor) throw new Error("State transform is missing an id or waitFor");
			if(!transform.easing) transform.easing = schema.easing;
			if(typeof transform.easing === "string") transform.easing = schema.easingOptions[transform.easing];	
			if(schema.transitionTime && !transform.transitionTime && transform.transitionTime !== 0) transform.transitionTime = schema.transitionTime;
			
			transform.animation = animationStateMethods.setTransformAnimation(transform, matrix[transform.matrixElem]);

			transform.setAnimationTimout();

			//set initial animations that don't have a waitfor
			if(!transform.waitFor) start[state].push(transform);		
			transformArr.push(transform);
		});

		transformArr.forEach(function(transform) {
			transform
				.setTotalAnimationTime(transformArr)
				.setCallbacks(transformArr);
		});
	},


	setTransformAnimation: function(transform, matrix) {		
		return function(cb, el, active, state) {
			setTimeout(function() {
				if(!active[state]) return;

				transform.transformString = transform.setTransformString(matrix);
				transform.waitingFor = transform.callbacks.length;

				var drawPath = transform.setDrawPath(),
					repeat = transform.setRepeat(cb, el, active, state),
					transitionTime = transform.setTransitionTime(),
					snapElems = transform.snapElem;
					
				snapElems.forEach(function(snapElem) {
					snapElem.stop();

					transform
						.animateTransform(transitionTime, cb, el, active, state, repeat, snapElem)
						.animatePath(transform.path, transitionTime, snapElem)
						.animatePoints(transform.points, transitionTime, snapElem)
						.animateDrawPath(drawPath, transitionTime, snapElem)
						.animateAttr(transform.attr, transitionTime, snapElem);
				});	

			}, transform.timeout);
		};
	},



	setStatesToAnimation: function(animations, state, start, elem, active) {
		animations[state] = function() {
			start[state].forEach(function(t) {
				t.animation(function() {}, elem, active, state);
			});
		};
	},


	setTriggerElement: function(i, schema) {
		var current = schema.events[i],
			el = schema.elem;
			
		//allows for the event to be attached to an ancestor or sibling element specified in the schema
		if(!current.selector) current.selector = schema.selector + "-animate";

		var ancestorElem = animationStatesHelpers.closest(el, current.selector);
		if(ancestorElem) el = ancestorElem;
		else {
			var siblings = animationStatesHelpers.getSiblings(el);
			var selector = current.selector.substring(1);
			for(var j = 0; j < siblings.length; j++) {
				var elemId = siblings[j].id;
				var elemClass = siblings[j].className;

				if(elemId.indexOf(selector) != -1 || elemClass.indexOf(selector) != -1) {
				// if(elemId.includes(selector) || elemClass.includes(selector)) {
					el = siblings[j];
					break;
				}
			}
		}
		
		return el;
	},


	setTriggerEvent: function(i, schema, el) {
		var current = schema.events[i],
			active = schema.active,
			animations = schema.animations,
			nonToggleEvents = schema.nonToggleEvents,
			isRadio = current.inputType == 'radio' ? true : false;

		//check if current state is part of an array/toggle
		if(!(current.state instanceof Array)) nonToggleEvents.push(current.state);

		//set active States
		var statesArray = [];
		if(schema.initState) {
			var initIndex = current.state.indexOf(schema.initState);
			if(initIndex !== 0) {
				statesArray = current.state.slice(initIndex, initIndex + 1);
				statesArray = statesArray.concat(current.state.slice(0, 1));
			} else statesArray = current.state;
		} else statesArray = current.state;

		el.addEventListener(current.event, function(e) {
			//if it's a toggle event
			if(current.state instanceof Array) {	
				var initState = statesArray[0],
					toggleState = statesArray[1];

				if(active[initState]) {
					active[initState] = false;
					active[toggleState] = true;
					animations[toggleState]();			
				} else {
					active[initState] = true;
					active[toggleState] = false;
					animations[initState]();
				}
			} 

			//non toggle events
			else {
				if(nonToggleEvents.length > 1) {
					nonToggleEvents.forEach(function(state) {
						active[state] = state == current.state ? true : false;
					});
				} else if(!active[current.state]) active[current.state] = true;	

				animations[current.state](); 
			}
		});
	},
};





/****************************************************************
					   SvgSchema Constructor
*****************************************************************/
function SvgSchema(elem, schema) {
	//schema options
	this.elem = elem;
	this.selector = elem.id ? elem.id : schema.selector;
	this.selectorName = schema.selector.substring(1);
	this.svg = schema.svg;

	//if this svg is to be animated
	if(schema.states) {
		//schema options
		this.states = schema.states;
		this.events = schema.events;
		this.initState = schema.initState;
		this.transitionTime = schema.transitionTime;
		this.easing = schema.easing;
		// this.duplicate = schema.duplicate;
		//additional options
		this.animations = {};
		this.active = {};
		this.matrix = {};
		this.start = {};
		this.nonToggleEvents = [];
		this.easingOptions = {
			easein: mina.easein,
			easeout: mina.easeout,
			easeinout: mina.easeinout,
			linear: mina.linear,
			backin: mina.backin,
			backout: mina.backout,
			elastic: mina.elastic,
			bounce: mina.bounce
		};
	} else return; //otherwise stop right there
}

SvgSchema.prototype.setActiveStates = function() {
	var toggleArr = [],
		events = this.events,
		active = this.active,
		initState = this.initState;

	for(var event in events) {
		if(events[event].state instanceof Array) toggleArr = events[event].state;
		else active[events[event].state] = false;
	}

	if(toggleArr.length > 0) {
		toggleArr.forEach(function(state) {
			if(initState) active[state] = initState == state ? true : false;
			else {
				active[toggleArr[0]] = false;
				active[toggleArr[1]] = true;
			}
		});
	}
};









/****************************************************************
					  Transform Constructor
*****************************************************************/
function Transform(transform, schema) {
	//from schema
	this.selector = schema.selectorName;

	//from transform
	this.id = transform.id;
	this.waitFor = transform.waitFor;
	this.element = transform.element;
	this.transitionTime = transform.transitionTime;
	this.easing = transform.easing;
	this.x = transform.x;
	this.y = transform.y;
	this.r = transform.r;
	this.s = transform.s;
	this.path = transform.path;
	this.points = transform.points;
	this.drawPath = transform.drawPath;
	this.attr = transform.attr;
	this.repeat = transform.repeat;
	this.timeout = transform.timeout;
	this.matrixElem = this.element.toCamelCase();
	this.snapElem = this.setSnapElem(schema.elem);
	this.callbacks = [];

}

Transform.prototype.setTransformString = function(matrix) {
	if(this.x !== undefined) matrix.x = this.x;
	if(this.y !== undefined) matrix.y = this.y;
	if(this.r !== undefined) matrix.r = this.r;
	if(this.s !== undefined) matrix.s = this.s;

	var transformString;
	if(matrix.x !== undefined || matrix.y !== undefined || matrix.r !== undefined || matrix.s !== undefined) {

		//check for additional rotate and scale data
		if(matrix.r !== undefined && !(matrix.r instanceof Array) || matrix.s !== undefined && !(matrix.s instanceof Array)) {
			var bbox = this.snapElem[0].getBBox(1);
			if(matrix.r !== undefined && !(matrix.r instanceof Array)) matrix.r = [matrix.r, bbox.cx, bbox.cy];
			if(matrix.s !== undefined && !(matrix.s instanceof Array)) matrix.s = [matrix.s, matrix.s, bbox.cx, bbox.cy];
		}

		transformString = "t";
		transformString += matrix.x !== undefined ? matrix.x + "," : "0,";
		transformString += matrix.y !== undefined ? matrix.y + "," : "0,";
		transformString += matrix.r !== undefined ? "r" + matrix.r + "," : "";
		transformString += matrix.s !== undefined ? "s" + matrix.s : "";
	}
	return transformString;
};

Transform.prototype.setDrawPath = function() {
	var path = this.drawPath;
	if(path !== undefined) {
		if(path instanceof Object) 
			path = Math.floor(Math.random() * (path.max - path.min + 1) + path.min);

		path += path < 0 ? 100 : -100;
		path = path / -100;
	}	
	return path;
};

Transform.prototype.setTransitionTime = function() {
	var transform = this,
		transitionTime = this.transitionTime,
		newTime;

	if(transitionTime instanceof Object) //transitionTime:{ min:__, max:__ }
		newTime = Math.floor(Math.random() * (transitionTime.max - transitionTime.min + 1) + transitionTime.min);
	else newTime = transitionTime;

	return newTime;
};

Transform.prototype.setSnapElem = function(el) {
	var snapElem;

	//parentElement => element gives unique snap elements
	if(el.id) snapElem = Snap.select('#' + el.id + ' ' + this.element);			
	else snapElem = Snap.selectAll('.' + this.selector + ' ' + this.element);	
	if(!snapElem) throw new Error("missing element in transform list: " + this.element);

	if(snapElem.length !== undefined) snapElem = snapElem.items;
	if(snapElem.length === undefined) snapElem = [snapElem];
	// if(snapElem.length !== undefined) snapElem = snapElem[0];
	
	return snapElem;
};

Transform.prototype.setRepeat = function(cb, el, active, state) {
	var transform = this;
	
	if(transform.repeat) {
		return function() {
			if(transform.repeat.loopDuration) //repeat x number of times until the loopduration is met
				transform.repeat.times = Math.ceil(transform.repeat.loopDuration / transform.totalAnimationTime) - 1;

			if(transform.repeat.repeated === undefined || isNaN(transform.repeat.repeated)) 
				transform.repeat.repeated = transform.repeat.times || 1;	

			if(transform.repeat.repeated <= 0) 
				delete transform.repeat.repeated;
			
			else if(!isNaN(transform.repeat.repeated)) {
				setTimeout(function() {
					transform.animation(cb, el, active, state);
					if(!transform.repeat.loop || transform.repeat.loop && transform.repeat.loopDuration) 
						transform.repeat.repeated--;
				}, transform.repeat.delay || 0);
			}
		};
	} else return null;
};

Transform.prototype.animateTransform = function(transitionTime, cb, el, active, state, repeat, snapElem) {
	var transform = this;
	snapElem.animate({ transform: transform.transformString }, transitionTime, this.easing, function() {	
		if(transform.callbacks.length === 0 && cb) cb();
		transform.callbacks.forEach(function(callback) {
			callback(function() {
				transform.waitingFor--;
				if(transform.waitingFor === 0) {
					if(repeat) repeat();
					if(cb) cb();
				}
			}, el, active, state);
		});
	});
	return this;
};

Transform.prototype.animatePath = function(path, transitionTime, snapElem) {
	if(path !== undefined) snapElem.animate({ d: path }, transitionTime, this.easing);
	return this;
};

Transform.prototype.animatePoints = function(points, transitionTime, snapElem) {
	if(points !== undefined) {
		var currentPoints = snapElem.attr('points'),
			currentPointsArr = [];

		for(var i = 0; i < currentPoints.length; i++) {
			var point = parseInt(currentPoints[i]);
			if(!isNaN(point)) currentPointsArray.push(point);
		}

		snapElem.animate(currentPointsArr, points, function(val) {
			snapElem.attr({ points:val });
		}, transitionTime, this.easing);
	}
	return this;
};

Transform.prototype.animateDrawPath = function(path, transitionTime, snapElem) {
	if(path !== undefined) { //path as a percentage that needs to be drawn
		var lineLength = snapElem.getTotalLength();
		snapElem.attr({ 'stroke-dasharray': lineLength + ' ' + lineLength });

		//if stroke-dashoffset is pre set in the svg and greater than the actual path length
		var offset = parseInt(snapElem.attr('stroke-dashoffset'));	
		if(offset > lineLength) snapElem.attr({ 'stroke-dashoffset': lineLength });

		snapElem.animate({ strokeDashoffset: lineLength * path }, transitionTime, this.easing);
	}
	return this;
};

Transform.prototype.animateAttr = function(attr, transitionTime, snapElem) {
	if(attr !== undefined && attr instanceof Object) snapElem.animate(attr, transitionTime, this.easing);
	return this;
};

Transform.prototype.setAnimationTimout = function() {
	if(this.id && this.id instanceof Array) {
		this.timeout = this.id[1];
		this.id = this.id[0];
	}
	if(this.waitFor && this.waitFor instanceof Array) {
		this.timeout = this.waitFor[1];
		this.waitFor = this.waitFor[0];
	}
	return this;
};

Transform.prototype.setTotalAnimationTime = function(transforms) {
	var transform = this;
	if(transform.repeat && transform.repeat.loopDuration) {
		transform.totalAnimationTime = transform.transitionTime;
		transforms.forEach(function(t) {
			if(transform.id == t.waitFor) transform.totalAnimationTime += t.transitionTime;
		});
	}
	return this;
};

Transform.prototype.setCallbacks = function(transforms) {
	var transform = this;
	//if it has an id it gets a callback
	if(transform.id) {
		transforms.forEach(function(t) {
			if(t.animation && transform.id == t.waitFor) {
				transform.callbacks.push(t.animation);
			}
		});
	}
	return this;
};










/****************************************************************
					 		Helpers
*****************************************************************/
String.prototype.replaceAll = function(search, replacement) {
	return this.split(search).join(replacement);

};

String.prototype.toCamelCase = function() {
	// remove all characters that should not be in a variable name
	// as well underscores an numbers from the beginning of the string
	var s = this.replace(/([^a-zA-Z0-9_\- ])|^[_0-9]+/g, "").trim().toLowerCase();
	// uppercase letters preceeded by a hyphen or a space
	s = s.replace(/([ -]+)([a-zA-Z0-9])/g, function(a,b,c) {
		return c.toUpperCase();
	});
	// uppercase letters following numbers
	s = s.replace(/([0-9]+)([a-zA-Z])/g, function(a,b,c) {
		return b + c.toUpperCase();
	});
	return s;
};

var animationStatesHelpers = {
	getChildren: function(n, skipMe) {
		var r = [];
		for ( ; n; n = n.nextSibling ) 
		if ( n.nodeType == 1 && n != skipMe)
			r.push( n );        
		return r;	
	},
	getSiblings: function(n) {
		return this.getChildren(n.parentNode.firstChild, n);
	},
	closest: function(el, selector) {
		var matchesFn;
		// find vendor prefix
		['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
			if (typeof document.body[fn] == 'function') {
				matchesFn = fn;
				return true;
			}
			return false;
		});
		var parent;
		// traverse parents
		while (el) {
			parent = el.parentElement;
			if (parent && parent[matchesFn](selector)) {
				return parent;
			}
			el = parent;
		}
		return null;
	}
};