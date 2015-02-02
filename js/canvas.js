paper.install(window);
var canvas, ctx, translatePos, scale, rotAngle, img;
var STEPSIZE = 50;
var ROTSPEED = Math.PI/30;
var SCALESPEED = 1.2;
var translatePos = new Point(0, 0);
var route = {x: [], y: []};
var state = "move";
var close = false;

function initImage(e){
   	img = new Image();
    img.onload = function()
    {	  
    	resetCanvas();   
    	draw(img, scale, translatePos);
    	$( "#file-input-div" ).hide();        
        $( "#toolbox" ).show();
    	$(document).keydown(onKeyDown);       
    }
    img.src = e.target.result;
}

function initImageUrl(url){
	
   	img = new Image();
    img.onload = function()
    {	
		resetCanvas();     
    	draw(img, scale, translatePos);
    	$( "#file-input-div" ).hide();
        $( "#toolbox" ).show();
    	$(document).keydown(onKeyDown);
    }
    img.src = url;
}

function resetCanvas(){
   	translatePos = {x: 0, y: 0};
	scale = 1.0; 
	rotAngle = 0;
}

function draw(image, scale, translatePos, rotAngle) { // Draw it
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    setView();
	ctx.drawImage(image, -image.width / 2, -image.height / 2);
    drawPath()
	ctx.restore();
}

function setView(){
    ctx.translate(canvas.width / 2, canvas.height / 2);  
    ctx.rotate(rotAngle);
    ctx.scale(scale,scale); 
    ctx.translate(translatePos.x,translatePos.y);  
}

function drawPath() {
    ctx.beginPath(); 
    ctx.lineWidth="4";
    ctx.strokeStyle="red"; // Green path
    ctx.moveTo(route.x[0],route.y[0]);
    for (i = 1; i < route.x.length; i++){
        ctx.lineTo(route.x[i],route.y[i]);
    }    
    ctx.stroke();
    if(state=="draw")
        for (i = 0; i < route.x.length; i++){
            drawPoint(route.x[i],route.y[i], 2);
        }
   
}

function drawPoint(px,py,size) {
    ctx.lineWidth="3";
    ctx.strokeStyle="black";
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(px,py, size, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function onKeyDown(evt) {
	if (evt.keyCode == 39 || evt.keyCode == 68){
		step("right");
	}
	else if (evt.keyCode == 37 || evt.keyCode == 65){
		step("left");
	}
	else if (evt.keyCode == 38 || evt.keyCode == 87) {
		step("up");
	}
	else if (evt.keyCode == 40 || evt.keyCode == 83) {
		step("down");
	}
	else if (evt.keyCode == 81) rotate("right");
	else if (evt.keyCode == 69) rotate("left");
	else if (evt.keyCode == 32) {
        resetCanvas();
        draw(img, scale, translatePos, rotAngle);
    }
}

function rotate(dir){
    if (dir=="right"){
        rotAngle += ROTSPEED;
    }
    else if (dir=="left"){
        rotAngle -= ROTSPEED;
    }
    draw(img, scale, translatePos, rotAngle);
}

function step(dir){
    if (dir=="right"){
        translatePos = fromWindowToCanvas(new Point(-1,0)).multiply(STEPSIZE).add(translatePos);
    }
    else if (dir=="left"){
        translatePos = fromWindowToCanvas(new Point(1,0)).multiply(STEPSIZE).add(translatePos);
    }
    else if (dir=="up") {
        translatePos = fromWindowToCanvas(new Point(0,1)).multiply(STEPSIZE).add(translatePos);
    }
    else if (dir=="down") {
        translatePos = fromWindowToCanvas(new Point(0,-1)).multiply(STEPSIZE).add(translatePos);
    }
    draw(img, scale, translatePos, rotAngle);
}

function scroll(e) {
    if(e.originalEvent.wheelDelta /120 > 0) {
        scale = scale * SCALESPEED;
        scale=Math.min(scale,20);
   		draw(img, scale, translatePos, rotAngle);   
    }
    else{
        scale = scale / SCALESPEED;
        scale=Math.max(scale,0.05);
   		draw(img, scale, translatePos, rotAngle);   
    }
}	

function fromWindowToCanvas(vector){
    //Adjust moving vector to canvas orientation
	return vector.rotate(-rotAngle*180/Math.PI,new Point(0,0)).divide(scale);
}
	
function mouseMove(e){
	translatePos = fromWindowToCanvas(new Point(e.pageX-x,e.pageY-y)).add(translatePos);
	x = e.pageX;
	y = e.pageY;
	draw(img, scale, translatePos, rotAngle);
}

function mouseMoveDraw(e){
    mousePoint = new Point(e.pageX - canvas.width / 2, e.pageY - canvas.height / 2);
    mousePoint = fromWindowToCanvas(mousePoint);
    mousePoint = mousePoint.subtract(translatePos);
    routePoint = findClosestPoint(route,mousePoint);
    if(routePoint.dist < 5 / scale){
        ctx.save();
        setView(); 
        drawPoint(route.x[routePoint.idx],route.y[routePoint.idx],4);
        ctx.restore();        
        close = true;
    } else if (close == true){
        draw(img, scale, translatePos, rotAngle);
        close = false; 
    }   
}

function setState(newState, element){
    state = newState;    
    $("#toolbox i").css("color", "black");
    element.style.color = "green";
    draw(img, scale, translatePos, rotAngle); 
    if(state == "draw"){
        canvas.onmousemove = mouseMoveDraw; 
    } else {
        canvas.onmousemove = null;
    }
}

function mouseDown(e){
    canvas.onmousemove = null; 
    if(state == "move"){
        x = e.pageX;
        y = e.pageY;
        drag = true;
        canvas.onmousemove = mouseMove;
    } else if(state == "draw"){
        if(e.ctrlKey){
            removeClosestPoint(e); 
        } else {
            addRoutePoint(e);
        }            
        canvas.onmousemove = mouseMoveDraw; 
    }
}

function mouseUp(){ 
    if(state == "move"){
        canvas.onmousemove = null;
    }
}

function addRoutePoint(e){
  routePoint = new Point(e.pageX - canvas.width / 2, e.pageY - canvas.height / 2)
  routePoint = fromWindowToCanvas(routePoint)
  routePoint = routePoint.subtract(translatePos)
  route.x[route.x.length] = routePoint.x;
  route.y[route.y.length] = routePoint.y;
  draw(img, scale, translatePos, rotAngle);
}

function removeClosestPoint(e){
    mousePoint = new Point(e.pageX - canvas.width / 2, e.pageY - canvas.height / 2);
    mousePoint = fromWindowToCanvas(mousePoint);
    mousePoint = mousePoint.subtract(translatePos);
    routePoint = findClosestPoint(route,mousePoint);
    if(routePoint.dist < 5 / scale){
        removeRoutepoint(routePoint.idx);
        draw(img, scale, translatePos, rotAngle);
    }
}

function removeRoutepoint(point) {
    route.x.splice(point,1);
    route.y.splice(point,1);
    draw(img, scale, translatePos, rotAngle);
}

function findClosestPoint(path,point) {
    minDist = Infinity;
    minIdx = -1;
    for (i = 0; i < path.x.length; i++){
        dist = squareDist(path.x[i],path.y[i],point.x,point.y);
        if(dist < minDist){
            minDist = dist;
            minIdx = i;
        }
    }
    return {idx: minIdx, dist: minDist}; 
}

function squareDist(xa,ya,xb,yb){
    xd = xa - xb;
    yd = ya - yb;
    return Math.sqrt(xd*xd + yd*yd);
}

$(document).ready(function() {
	canvas = document.querySelector('canvas');	
	ctx = canvas.getContext('2d');
	 
	canvas.style.width='100%';
	canvas.style.height='100%';
	canvas.width  = $(canvas).parent().width();
	canvas.height = $(canvas).parent().height();

	$(canvas).bind('mousewheel', scroll); //TODO: Works only for chrome???

	canvas.onmousedown = mouseDown;
	canvas.onmouseup = mouseUp;

	$('#file-input').change(function(e) {
        var file = e.target.files[0],
            imageType = /image.*/;
        
        if (!file.type.match(imageType))
            return;
        
        var reader = new FileReader();
        reader.onload = initImage;
        reader.readAsDataURL(file);
        
    });
});
