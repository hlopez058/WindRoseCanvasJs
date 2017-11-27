window.onload= function()
{
    var c = document.getElementById("myCanvas");
    ctx = c.getContext("2d");
    ctx.canvas.width  = window.innerWidth  - (window.innerWidth*.20);
    ctx.canvas.height = window.innerHeight;
    center = {x:ctx.canvas.width/2,
        y:ctx.canvas.height/2};
    chartSize = center.x/2;
    newDataAvailable = false;

    var slider = document.getElementById("myRange");
    var sliderSpeed = document.getElementById("speedValue");
    speed =1;
    sliderSpeed.innerHTML=speed;

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        speed = this.value;
        sliderSpeed.innerHTML=speed;
    } 
    
    vectorPathData = [];
    vectorPathInterp =[];
    vectorPathInterpStep = 0;
    vectorPathInterpMax = 0;
  
    //load data to follow vector ?
    update();
}

function getInterpolatedPath(vPathData){
    var dataInDegrees = true;
    var vectorpathInterp = [];
    vPathDataMax = vPathData.length

    //normalize the length parameter
    var maxL =0;
    for(var i = 1 ; i<vPathDataMax;i++)
    {
        var v = vPathData[i];
        if(v.length>maxL){ maxL =v.length}
    }

    //interpolate vPath 
    for(var i = 1 ; i<vPathDataMax;i++){
        var v0 = vPathData[i-1];
        var v1 = vPathData[i];
        //get distance to next sample
        var t0 = new Date(v0.time);
        var t1 = new Date(v1.time);
        var diff = Math.abs(Date.parse(t0)-Date.parse(t1))/(1000);
        //get angle intervals
        var a0 = v0.angle;
        var a1 = v1.angle;
        var angle_step = Math.abs(a0-a1) / diff;
        //get interval of length 
        var l0 = v0.length/maxL;
        var l1 = v1.length/maxL;
        var dirElong = l0>l1?-1:1;
        var length_step = Math.abs(l1-l0) / diff;
        
        //create interpolated points
        for(var k=0;k<diff;k++){    
            var tk = new Date(t0.toUTCString());
            tk.setMilliseconds(k);

             var ak = (a0 + angle_step*k) 
             if(dataInDegrees){
                 ak = ak * (Math.PI/180);
             }
             var lk = (l0 + length_step*k*dirElong);
             vectorpathInterp.push(
                {   
                    time: tk.toTimeString(),
                    angle: ak,
                    length : lk
                }
            )
        }
    }

    return vectorpathInterp;
}

$(document).ready(function(){
$('#submit').on("click",function(e){
    e.preventDefault();
    $('#files').parse({
        config: {
            delimiter: "",	// auto-detect
            newline: "",	// auto-detect
            quoteChar: '"',
            header: true,
            dynamicTyping: true,
            preview: 0,
            encoding: "",
            worker: false,
            comments: false,
            step: undefined,
            complete: parseData,
            error: undefined,
            download: false,
            skipEmptyLines: false,
            chunk: undefined,
            fastMode: undefined,
            beforeFirstChunk: undefined,
            withCredentials: undefined
        },
        before: function(file, inputElem)
        {console.log("Parsing file...", file);
        },error: function(err, file)
        {console.log("ERROR:", err, file);
        },complete: function()
        {console.log("Done with all files");
        }
    });
});
});

function parseData(results){
    console.log(results);

    //step through each of the results data
    //pull out the attributes and update
    //and assign the values to the 
    //path array

    if(vectorPathData.length >= 0){
        vectorPathData.length = 0;
        var data = results.data;
        //load new data into array;
        for(i=0;i<data.length;i++){
            var coordinate = {
                time:data[i].Time,
                angle:data[i].Angle,
                length: data[i].Length};
                vectorPathData.push(coordinate);
        }
        
        newDataAvailable = true;
    }
 }

function update(){
    //clear canvas for animation frame
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)

    
    //load new set of interpolated data
    if(newDataAvailable){
        vectorPathInterp = getInterpolatedPath(vectorPathData);
        vectorPathInterpStep = 0;
        vectorPathInterpMax = vectorPathInterp.length;
        newDataAvailable = false;
    }
    

    //update vectors
    if(vectorPathInterpStep>vectorPathInterpMax-1){
        vectorPathInterpStep = 0;
    }
    
    drawVector();
    

    vectorPathInterpStep = vectorPathInterpStep + (speed-1);
    var progressNow = (vectorPathInterpStep/vectorPathInterpMax * 100) ;
    $('.progress-bar').css('width', progressNow+'%').attr('aria-valuenow', progressNow);


    //set the background 
    drawChart()

    
    //new animation frame
    requestAnimationFrame(update);
}

function drawChart(){


    ctx.save();
    ctx.strokeStyle="gray";
    //draw y axis
    var ymax = 30;
    var ydiv =10
    var ystep = ymax/ydiv;
    var ylabel = ystep;
    for(var i=.1; i <=1 ; i+=.1){
        ctx.setLineDash([5, 3]);
        //draw circle in center screen
        ctx.fillText(ylabel,center.x+10,center.y - chartSize*i);
        
        if(i!=1){
        ctx.beginPath();
        ctx.arc(center.x,center.y,chartSize*i,0,2*Math.PI);
        ctx.stroke();
        } 
        ylabel+=ystep;
    }

    //draw guidelines
    var xmax = 360;
    var xdiv = 20;
    var xstep = xmax/xdiv;
    var xlabel = 0;
    for(var i=0; i <=1 ; i+=.1)
    {

        var ang = Math.PI*i;
        ctx.beginPath();
        ctx.moveTo(center.x,center.y);
        var xpos = Math.cos(ang)*(chartSize+30) + center.x;
        var ypos = Math.sin(ang)*(chartSize+30) + center.y;
        ctx.lineTo(xpos,ypos);
        ctx.fillText(xlabel,xpos,ypos);
        if(i==0){ctx.fillText(","+xmax,xpos+10,ypos);}
        ctx.stroke();

        xlabel+= xstep;
    }

    for(var i=.1; i <=.9 ; i+=.1)
    {
        var ang = Math.PI*i;
        ctx.beginPath();
        ctx.moveTo(center.x,center.y);
        var xpos = -Math.cos(ang)*(chartSize+30) + center.x;
        var ypos = -Math.sin(ang)*(chartSize+30) + center.y;
        ctx.lineTo(xpos,ypos);
        ctx.fillText(xlabel,xpos,ypos);
        ctx.stroke();    
        
        xlabel+= xstep;
    }
    ctx.restore();

    
    //draw circle in center screen
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth =2;
    ctx.arc(center.x,center.y,chartSize,0,2*Math.PI);
    ctx.stroke();   
    ctx.restore(); 

    //draw lines
    ctx.beginPath();
    ctx.moveTo(center.x-chartSize,center.y);
    ctx.lineTo(center.x+chartSize,center.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(center.x,center.y-chartSize);
    ctx.lineTo(center.x,center.y+chartSize);
    ctx.stroke();
       


    //draw the 
    return ctx;
}

function drawVector()
{

    if(vectorPathInterp.length == 0){return;}
    
    var v = vectorPathInterp[vectorPathInterpStep];

    //crete a vector 
    var w = vector.create(center.x,center.y);
    w.setAngle(v.angle)
    w.setLength(v.length * chartSize);
    
    ctx.save();
    ctx.lineWidth=10;
    ctx.beginPath();
    ctx.strokeStyle="rgba(127,255,0,0.7)";
    ctx.lineCap="round";
    ctx.moveTo(center.x,center.y);
    ctx.lineTo(w.getX() + center.x,w.getY()+center.y);
    ctx.stroke();
    ctx.restore();


    ctx.font = '40pt';
    ctx.fillText(v.time, 20, 20);      
    ctx.fillText("Angle:" + Math.trunc(v.angle*(180/Math.PI)) + "deg.", 20, 40);
    ctx.fillText("Length:"+Math.trunc(v.length), 20, 60);    
}
