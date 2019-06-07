var SEPARATION = 100,
    AMOUNTX = 50,
    AMOUNTY = 50;

var container;
var controls;
var composer;
var clock;
var resloaded = 0,
    aPoints = [],
    pointTexture, currentAnimatePoints;
var camera, scene, renderer;

var particles, particle, count = 0;

var mouseX = 0,
    lastX = 0,
    translateX = 0;
var mouseY = 0,
    lastY = 0,
    translateY = 0;
var minX = 0,
    maxX = 0,
    totalChange = 0;
var currentAnimateIndex = -1;

var xBgPoints, yBgPoints, zBgPoints;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var positionAnimate, rotationAnimate;
var lastClickTime,
    width = window.innerWidth,
    height = window.innerHeight;

var isMoving = false;

var tweenParam = {
    "firefly": 0.0020000000000000018,
    "fireflySLOW": 0.002,
    "fireflyFAST": 0.04
};

init();
animate();
//初始化3D场景
function init() {
    if (listenScreenResize()) {

        clock = new THREE.Clock();
        container = document.createElement('div');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 50000);
        camera.position.z = 1000;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0005);
        scene.background = new THREE.Color(0x0c0c18);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(new THREE.Color(0x000, 1.0));
        renderer.shadowMapEnabled = true;
        container.appendChild(renderer.domElement);

        initBackgroudPoints();
        loadAnimatePoints();
        var renderPass = new THREE.RenderPass(scene, camera);
        var effectFilm = new THREE.FilmPass(.5, .5, 1500, !1);
        var shaderPass = new THREE.ShaderPass(THREE.FocusShader);
        shaderPass.uniforms.screenWidth.value = window.innerWidth,
            shaderPass.uniforms.screenHeight.value = window.innerHeight,
            shaderPass.renderToScreen = true;

        composer = new THREE.EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(effectFilm);
        composer.addPass(shaderPass);

        //controls = new THREE.OrbitControls( camera, renderer.domElement );

        var axes = new THREE.AxesHelper(2000);
        //scene.add(axes);

        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        $(document).on("mousewheel DOMMouseScroll", onMouseWheel);
        window.addEventListener('resize', onWindowResize, false);
        $('.nav').on('tap', 'a', function (e) {
            var obj = $(findParentA(e.target));
            var index = obj.attr('index');
            activeIndex(index);
        });
    }
}
//横竖屏处理
function listenScreenResize() {
    setInterval(function () {
        if (width != window.innerWidth || height != window.innerHeight) {
            judgeLandscape(true);
        }
    }, 500);
    return judgeLandscape();
}
//横竖屏处理
function judgeLandscape(isResize) {
    width = window.innerWidth;
    height = window.innerHeight;
    if (isResize) {
        location.reload();
        return;
    }
    if (width < height) {
        $('body').attr('style', 'background-color:#fff;');
        $("body").empty().append("<div class='landscape'></div>");
        return false;
    }
    return true;
}
//切换场景
function activeIndex(index) {
    if (isMoving) return;
    isMoving = true;
    setTimeout(function () {
        isMoving = false;
    }, 2500);
    index = parseInt(index);

    if (index != currentAnimateIndex) {
        prepareMove(index, 1);
        $('.active').removeClass('active');
        $('.section').removeClass('fp-completely').hide();
        $('.page' + (index + 1)).addClass('fp-completely').fadeIn(3000);
        $('[index="' + index + '"]').parent().addClass("active");
    }
}
//键盘事件监听，进行场景切换
function onKeyDown(e) {
    if (e.keyCode == 38 && currentAnimateIndex > 0) {
        activeIndex(currentAnimateIndex - 1);
    } else if (e.keyCode == 40 && currentAnimateIndex < 4) {
        activeIndex(currentAnimateIndex + 1);
    }
}
//鼠标事件监听，进行场景切换
function onMouseWheel(e) {

    var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || // chrome & ie
        (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1)); // firefox
    if (delta > 0 && currentAnimateIndex > 0) {
        activeIndex(currentAnimateIndex - 1);
    } else if (delta < 0 && currentAnimateIndex < 4) {
        activeIndex(currentAnimateIndex + 1);
    }
}
//查找导航对应序号，进行场景切换
function findParentA(el) {
    var returnObj = el;
    if (el.nodeName != 'A') {
        returnObj = findParentA(el.parentElement);
    }
    return returnObj;
}
//屏幕大小变化进行自适应
function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}
//鼠标移动记录位置变化
function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}
//为光点设置随机坐标
function randomPosition(min, max) {
    return Math.random() * (max - min) + min;
}
//设置背景的光点
function initBackgroudPoints() {
    var geometry = new THREE.Geometry,
        pointCount = 500, //绕XYZ轴旋转的点各500个
        max = 1500; //点的最大XYZ轴坐标
    geometry.colors = [];
    for (var i = 0; pointCount > i; i++) {
        geometry.vertices.push(new THREE.Vector3(randomPosition(-max, max), randomPosition(-max, max),
            randomPosition(
                -max, max)));
        geometry.colors.push(new THREE.Color("hsl(" + (190 + 30 * Math.random()) + ", 0%, 100%)"));
    }
    pointTexture = new THREE.TextureLoader().load('assets/gradient.png');
    var material = new THREE.PointsMaterial({
        size: 5,
        map: pointTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: THREE.VertexColors
    });
    xBgPoints = new THREE.Points(geometry, material),
        xBgPoints.position.z = -0.5 * max,
        xBgPoints.position.x = -.3 * max,
        yBgPoints = new THREE.Points(geometry, material),
        yBgPoints.position.z = -.6 * max
    yBgPoints.position.x = -0.2 * max,
        yBgPoints.position.y = 0,
        zBgPoints = new THREE.Points(geometry, material),
        zBgPoints.position.z = -.7 * max,
        scene.add(xBgPoints);
    scene.add(yBgPoints);
    scene.add(zBgPoints);
}
//从json中读取场景光点坐标
function loadAnimatePoints() {
    var index = 0;
    urls = ["assets/cpgame3.json", "assets/cpac5.json", "assets/cpbook2.json", "assets/cpmovie4.json",
        "assets/cpkv3.json"
    ];
    var material = new THREE.PointsMaterial({
        size: 5,
        map: pointTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: THREE.VertexColors
    });
    urls.forEach(function (url, urlIndex) {
        new THREE.JSONLoader().load(url, function (obj) {
            resloaded += .1;
            var colors = [];
            obj.vertices.forEach(function () {
                colors.push(new THREE.Color("hsl(160, 100%, 100%)"))
            });
            obj.material = material;
            for (var i = 0; i < obj.faces.length; i++) {
                var faceItem = obj.faces[i];
                colors[faceItem.a] = faceItem.vertexColors[0] || new THREE.Color("hsl(" + (160 + 0 *
                        Math.random()) + ", 100%, 100%)"),
                    colors[faceItem.b] = faceItem.vertexColors[1] || new THREE.Color("hsl(" + (160 +
                        0 * Math.random()) + ", 100%, 100%)"),
                    colors[faceItem.c] = faceItem.vertexColors[2] || new THREE.Color("hsl(" + (160 +
                        0 * Math.random()) + ", 100%, 100%)")
            }
            obj.colors = colors;
            aPoints[urlIndex] = obj;
            index++;
            if (index === urls.length) {
                renderAnimatePoints();
            };
        })
    })
}
//将场景光点渲染到3D页面
function renderAnimatePoints() {
    var geometry = new THREE.Geometry;
    var max = 1000;
    geometry.colors = [];
    for (var n = 0; 13000 > n; n++) {
        geometry.vertices.push(new THREE.Vector3(randomPosition(-1 * max, max), randomPosition(-1 * max, max),
            randomPosition(-12 * max, 1 * max)));
        geometry.colors.push(new THREE.Color("hsl(" + (180 + 10 * Math.random()) + ", 100%, 100%)"));
    }
    var aMaterial = new THREE.PointsMaterial({
        size: 12,
        map: pointTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: THREE.VertexColors
    });
    currentAnimatePoints = new THREE.Points(geometry, aMaterial);
    currentAnimatePoints.position.z = 0;
    showFirstAnimatePoints();
}
//进入页面自动进行第一个场景的切换
function prepareMove(index, timeout) {
    var cameraObj = [{
            rotation: {
                x: -1.26,
                y: 0.16,
                z: 0.46
            },
            position: {
                x: 220,
                y: 1314,
                z: 414
            }
        },
        {
            rotation: {
                x: -0.247,
                y: 0.527,
                z: 0.126
            },
            position: {
                x: 747,
                y: 314,
                z: 1244
            }
        },
        {
            rotation: {
                x: -0.44,
                y: 0.06,
                z: 0.03
            },
            position: {
                x: 127,
                y: 908,
                z: 1954
            }
        },
        {
            rotation: {
                x: -1.5,
                y: -0.0025,
                z: -0.078
            },
            position: {
                x: -7.8,
                y: 3090,
                z: 100
            }
        },
        {
            rotation: {
                x: -0.25,
                y: -0.126,
                z: -0.032
            },
            position: {
                x: -257.17,
                y: 500.15,
                z: 1971.9
            }
        }
    ];
    setTimeout(function () {
        $("#text-container").show();
        currentAnimatePoints.stopRotation = true;
        camera.currentPosition = cameraObj[index].position;
        rotationAnimate = new TWEEN.Tween(camera.rotation).easing(TWEEN.Easing.Quintic.Out).to(cameraObj[
            index].rotation, index == 3 ? 2000 : 5000).start();
        positionAnimate = new TWEEN.Tween(camera.position).easing(TWEEN.Easing.Quintic.Out).to(cameraObj[
            index].position, index == 3 ? 3000 : 5000).start();
        exchangeToModel(index);
    }, timeout);
}
//显示第一个场景的光点
function showFirstAnimatePoints() {
    scene.add(currentAnimatePoints);
    prepareMove(0, 3000);
    setTimeout(function () {
        $('.page1').fadeIn(5000);
        $('.nav').fadeIn(5000);
    }, 2500);
}
//切换场景对应的3D模型
function exchangeToModel(index) {
    currentAnimateIndex = index;
    var endObj = aPoints[index];
    var positionObj = [{
            scale: 1200,
            x: -800,
            y: 0,
            z: 0
        },
        {
            scale: 1200,
            x: 500,
            y: -200,
            z: -800
        },
        {
            scale: 1400,
            x: 2400,
            y: 400,
            z: 0
        },
        {
            scale: 1200,
            x: 4000,
            y: -400,
            z: 0
        },
        {
            scale: 400,
            x: 00,
            y: -1000,
            z: -2000,
        }
    ];
    currentAnimatePoints.material.tween = new TWEEN.Tween(currentAnimatePoints.material).easing(TWEEN.Easing
        .Exponential.In);
    currentAnimatePoints.geometry.vertices.forEach(function (point, point_index) {
        var endPointIndex = point_index % endObj.vertices.length;
        var endPoint = endObj.vertices[endPointIndex];
        point.tweenvtx = new TWEEN.Tween(point).to({
                x: endPoint.x * positionObj[index].scale + positionObj[index].x,
                y: endPoint.y * positionObj[index].scale + positionObj[index].y,
                z: endPoint.z * positionObj[index].scale + positionObj[index].z
            }, 1500)
            .easing(TWEEN.Easing.Exponential.In)
            .delay(1000 * Math.random())
            .start();
    });
}
//产生光点动效
function backgroudPointsRender() {
    if (xBgPoints) { //introed
        xBgPoints.rotation.x -= tweenParam.firefly / 1.5;
        yBgPoints.rotation.y += tweenParam.firefly;
        zBgPoints.rotation.z += tweenParam.firefly / 2;
    }
}
//执行一次页面动画更新
function animate() {
    render();
    requestAnimationFrame(animate);
    TWEEN.update();
}
//渲染场景摄像头等
function render() {
    var delta = clock.getDelta();
    translateX = mouseX - lastX;
    translateY = mouseY - lastY;
    totalChange = translateX + translateY;
    var range = currentAnimateIndex == 3 ? 2 : 100;
    if (camera.currentPosition) {
        minX = camera.currentPosition.x - range;
        maxX = camera.currentPosition.x + range;
        if (camera.position.x > minX && totalChange > 0) {
            camera.position.x += totalChange * -0.1;
            if (camera.position.x > maxX) camera.position.x = maxX;
        }
        if (camera.position.x < maxX && totalChange < 0) {
            camera.position.x += totalChange * -0.1;
            if (camera.position.x < minX) camera.position.x = minX;
        }
    }
    lastX = mouseX, lastY = mouseY;

    camera.lookAt(scene.position);

    controls && controls.update(delta);
    backgroudPointsRender();
    composer.render(delta);
    if (currentAnimatePoints) {
        if (!currentAnimatePoints.stopRotation) currentAnimatePoints.geometry.rotateY(Math.PI / 600);
        currentAnimatePoints.geometry.verticesNeedUpdate = true;
        currentAnimatePoints.geometry.normalsNeedUpdate = true;
        currentAnimatePoints.geometry.colorsNeedUpdate = true;
        currentAnimatePoints.geometry.uvsNeedUpdate = true;
    }

}