# snap-animation-states
A Snap.svg plugin that lets you load and animate svgs using a simple schema.

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
#Schema
	* `selector: string` css selector - ex: ".icon-hamburger"
	<li><code>svg: string</code> svg string or svg file reference</li>
	<li><code>easing: string</code> "linear", "easein", "easeout", "easeinout", "backin", "backout", "bounce", "elastic"</li>
	<li><code>transitionTime: int</code>Transition time is applied to each transform.  A state with 3 transforms one after the other and a transitionTime of 500 ms will take a total of 1500 ms to finish</li>
	<li><code>initState: string</code>Set initState equal to the state you want to run when the plugin is called.</li>
	<li><code>states: obj</code> Contains the states and transforms to be performed.  Each state contains an array of transforms.</li>
	<ul>
		<li><code>key: state name</code><code>prop: array of transform objects</code></li>
		<ul>
			<li><code>id: int/string/arr</code> The id should be unique to its state. If you want the transform to start after a timeout, the id takes an array: [id, timeout:int]</li>
			<li><code>waitFor: int/string/arr</code> Set the waitFor property to the id of a transform that it should follow.  For a timeout, waitFor takes an array: [id, timeout: int]</li>
			<li><code>element: string</code> Takes the css selector of the element that the transform is affecting.</li>
			<li><code>x: int</code> Takes an x coordinate relative to the elements starting position</li>
			<li><code>y: int</code> Takes a y coordinate relative to the elements starting position</li>
			<li><code>r: int/array</code></li>
			<ul>
				<li>r:180 rotates the element 180 degrees around its center</li>
				<li>r:[180, 30, 30] rotates the element 180 degrees around the coordinates 30, 30 on the svg canvas</li>
			</ul>
			<li><code>s: int/array</code></li>
			<ul>
				<li>s:0.5 scales the element down to half its size.</li>
				<li>s:[0.5, 1] scales the element down to half its size horizontally without affecting its vertical size.</li>
				<li>s:[0.5, 0.5, 30, 30] scales the element down to half its size around the coordinates 30, 30 on the svg canvas</li>
			</ul>
			<!--<li><code>points: string</code></li>-->
			<li><code>attr: obj</code> Affect any svg attribute</li>			
			<li><code>path: string</code> Represented by the "d" attribute in an svg.  <a href="https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths">Learn more about paths.</a></li>
			<li><code>drawPath: int/obj</code></li>
			<ul>
				<li>int: percentage of path to draw. 0 is no path and 100 is the full path length</li>
				<li>obj: {min: minPath max: maxPath} Randomize your path length using min and max</li>
			</ul>	
			<li><code>transitionTime: int/obj</code></li>
			<ul>
				<li>int: transition time to override the base transition time</li>
				<li>obj: {min: minTime max: maxTime}  Randomize the transitionTime with a min and max</li>
			</ul>						
			<li><code>easing: string</code>same easing options as previously shown.  Useful if you have several types of easing you want to display from transform to transform</li>					
			<li><code>repeat: obj</code> Will repeat the entire state from the point the repeat is called</li>
			<ul>
				<li><code>loop :bool</code> set an infinite loop</li>
				<li><code>loopDuration :int</code> end loop after a time</li>
				<li><code>times: int</code> loop the animation x times</li>
			</ul>	
		</ul>				
	</ul>
	<li><code>events:array of objects</code></li>
	<ul>
		<li><code>event: string</code> works with any javascript event</li>
		<li><code>state: string/array</code></li>
		<ul>
			<li>string: string matches name of state you want to run when the event happens</li>
			<li>array: used for toggle events. ["state1", "state2"] can be toggled when the event happens</li>
		</ul>
		<li><code>selector: string</code> a css selector used to indicate where to watch for the event - ex: an svg inside an anchor tag.  The anchor tag will receive the selector so that when the anchor is clicked the svg animation runs.</li>
	</ul>
