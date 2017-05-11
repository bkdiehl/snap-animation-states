# snap-animation-states
A Snap.svg plugin that lets you load and animate svgs using a simple schema.

[View Docs and Demo](https://bkdiehl.github.io/)

# Installation

## Include JS

Include [`Snap.svg 0.4.1`](https://cdnjs.com/libraries/snap.svg/0.4.1) and `snap-animation-states.js` in the footer. No JQuery needed.

``` html
<script type="text/javascript" src="js/snap.svg.js"></script>
<script type="text/javascript" src="js/snap-animation-states.js"></script>
```

## Set HTML

Your SVGs need a container element. You just need to add whatever class you're calling your svg with to the element that will contain it.

``` html
<i class="icon-hamburger"></i><br> 
<i class="my-svg-selector"></i>    
```
				
## Call the plugin
				
It's as simple as calling the plugin with the correct schema.
```js
(function() {    
	SnapStates({ ...schema... })
})();
```
# Schema

* `selector: string` css selector - ex: ".icon-hamburger"
* `svg: string` svg string or svg file reference
* `easing: string` "linear", "easein", "easeout", "easeinout", "backin", "backout", "bounce", "elastic"
* `transitionTime: int`Transition time is applied to each transform.  A state with 3 transforms one after the other and a transitionTime of 500 ms will take a total of 1500 ms to finish
* `initState: string`Set initState equal to the state you want to run when the plugin is called.
* `states: obj` Contains the states and transforms to be performed.  Each state contains an array of transforms.
	- `key: state name` `prop: array of transform objects`
		* `id: int/string/arr` The id should be unique to its state. If you want the transform to start after a timeout, the id takes an array: [id, timeout:int]
		* `waitFor: int/string/arr` Set the waitFor property to the id of a transform that it should follow.  For a timeout, waitFor takes an array: [id, timeout: int]
		* `element: string` Takes the css selector of the element that the transform is affecting.
		* `x: int` Takes an x coordinate relative to the elements starting position
		* `y: int` Takes a y coordinate relative to the elements starting position
		* `r: int/array`
			- r:180 rotates the element 180 degrees around its center
			- r:[180, 30, 30] rotates the element 180 degrees around the coordinates 30, 30 on the svg canvas
		* `s: int/array`
			- s:0.5 scales the element down to half its size.
			- s:[0.5, 1] scales the element down to half its size horizontally without affecting its vertical size.
			- s:[0.5, 0.5, 30, 30] scales the element down to half its size around the coordinates 30, 30 on the svg canvas
		* `attr: obj` Affect any svg attribute			
		* `path: string` Represented by the "d" attribute in an svg. [Learn more about paths.](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
		* `drawPath: int/obj`
			- int: percentage of path to draw. 0 is no path and 100 is the full path length
			- obj: {min: minPath max: maxPath} Randomize your path length using min and max
		* `transitionTime: int/obj`
			- int: transition time to override the base transition time
			- obj: {min: minTime max: maxTime}  Randomize the transitionTime with a min and max
		* `easing: string` same easing options as previously shown.  Useful if you have several types of easing you want to display from transform to transform					
		* `repeat: obj` Will repeat the entire state from the point the repeat is called
			- `loop :bool` set an infinite loop
			- `loopDuration :int` end loop after a time
			- `times: int` loop the animation x times
	
* `events:array of objects`
	- `event: string` works with any javascript event
	- `state: string/array`
		* string: string matches name of state you want to run when the event happens
		* array: used for toggle events. ["state1", "state2"] can be toggled when the event happens
	- `selector: string` a css selector used to indicate where to watch for the event - ex: an svg inside an anchor tag.  The anchor tag will receive the selector so that when the anchor is clicked the svg animation runs.
