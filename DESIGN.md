! DRAWING IN 3D !

## INTRO
Drawing in 3D is a 3d website project that was run based on webpack node.js. It was written in javescript, html and css as the traditional form of web construction. Meanwhile, to form the 3D scene, I have used three.js, which is a cross-browser webGL javascript library and API that helps people to write 3D scene in web-based environment in an easier way.

## Web Interface Design
Drawing in 3D website is constructed with 4 html pages: index.html/ fustic.html/ palace.html/ room.html. Index page has a 3D manu that links to the other three subpages. Each subpage contain a different 3D scene that user could interact with by basic cursor interaction (drawing & clicking).

## Interaction Design
The interaction of each subpage is written with javascript. Basically, user could draw and click freely on the webcanvas and click the 'enable' button to view their drawing in a 3D perspective. This process is realized generally based on javascript event listener of mouse event and the ray-casting theory in webGL.

## Coding structure
Because of the webpack bundler issue, I was unable to let different html page access different js file (because of the time limitation, unable to solve this problem) So I combined all the three scene's js file into one and use "id = container" in each html file to distinguish which js loop in the script.js that should be run. (This is why script.js file has more than a thousand lines) Ideally, it should be seperated into several javascript classes in different files and called to be used in script.js.

For the bundler, in webpack.common.js, I have issued several copy of 'new CopyWebpackPlugin' for the export module. So that multiple html files can be run with the webpack bundler.

## Philosophy Idea
This project is not only a design approach of drawing in 3d by using 2d interaction, but also a poetic expression of a buddhist idea:

本来无一物，何处惹尘埃？
“Since all is void from the beginning，
Where can the dust alight？”

As the interaction in this website is actually using raycasting to find and intersect with the model being at the scene but invisible, the drawing and clicking path of the user will finally reveal the hidden being.







