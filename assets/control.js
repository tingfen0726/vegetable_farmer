// ==========================================
// 1. 全域配置與常數 (Configuration)
// ==========================================
const targetRatio = 3 / 8;
const size = window.innerWidth * 0.075; // 10% 的寬度
document.body.style.backgroundSize = `${size}px`;

// 圖片資源
var people_pic = [
    ["assets/picture/people_rake_smile.png", "assets/picture/people_rake_die.png"],
    ["assets/picture/people_rake_smile.png", "assets/picture/people_rake_die.png"],
    ["assets/picture/people_shovel_smile.png", "assets/picture/people_shovel_die.png"]
];
var tool_pic = ["assets/picture/rake.png", "assets/picture/rake.png", "assets/picture/shovel.png"];
var tool_text = ["rake", "triple rake", "shovel"];

// 遊戲參數
let shoot_speed = 0.05;
let cloud_speed = 0.001;
let level_speed = 1;
let shootCooldown = 300;
let shootDuration = 200;

// ==========================================
// 2. 遊戲狀態變數 (Game State)
// ==========================================
var myGamePiece;
let score = 0;
let money = 0;
let index = 0; // 當前裝備索引
let gameState = "intro";
let isDay = true;
let introFrame = 0;
let gameRunning = false;  // 遊戲是否執行
let gamePaused = false;   // 暫停狀態
let lastShootTime = 0;
let difficulty = 1;

// 實體集合
var vegetableSet = [];
var toolSet = [];
var cloudSet = [];
var starSet = []; 
var staticStarSet = [];
let starsInitialized = false;
var PropsSet = [];

// ==========================================
// 3. DOM 元素獲取 (DOM Elements)
// ==========================================
const stateDisplay = document.getElementById("state");
const rakeBtn = document.getElementById("rake");
const t_rakeBtn = document.getElementById("t_rake");
const shovelBtn = document.getElementById("shovel");
const glod_moneyBtn = document.getElementById("glod_money");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");
const storeBtn = document.getElementById("store");
const diffBtn = document.getElementById("difficulty");
const shop = document.getElementById("shop");

// 初始化按鈕樣式
rakeBtn.style.backgroundColor = "rgba(115, 115, 115, 0.3)";
rakeBtn.style.border = "2px solid rgb(142, 142, 142)";
// document.getElementById("cabbage").style.backgroundColor = "rgba(115, 115, 115, 0.3)";
// document.getElementById("carrot").style.backgroundColor = "rgba(115, 115, 115, 0.3)";
// document.getElementById("cabbage").style.border = "2px solid rgb(142, 142, 142)";
// document.getElementById("carrot").style.border = "2px solid rgb(142, 142, 142)";
document.getElementById("cabbage").style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)";
document.getElementById("carrot").style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)";
document.getElementById("cabbage").style.backgroundColor = "rgba(0, 0, 0, 0)";
document.getElementById("carrot").style.backgroundColor = "rgba(0, 0, 0, 0)";

// ==========================================
// 4. 輔助函數 (Helper Functions)
// ==========================================
function updateStateDisplay() {
    let level_text = "none";
    if(gameState == "playing" || gameState == "pause"){
        level_text = "x" + level_speed.toFixed(1);
    }
    stateDisplay.textContent = `state : ${gameState} | money : $${money} | arms : ${tool_text[index]} | level : ${level_text}`;
}

function everyinterval(n) {
    return (myGameArea.frameNo / n) % 1 === 0;
}
function everyintro(n) {
    return (introFrame / n) % 1 === 0;
} 

function getCanvasX(e) {
    const rect = myGameArea.canvas.getBoundingClientRect();
    return e.clientX - rect.left;
}

function startGame() {
    myGameArea.ready();
}

// ==========================================
// 5. 遊戲核心物件 (Game Engine)
// ==========================================
var myGameArea = {
    canvas : document.createElement("canvas"),
    ready : function() {
        this.canvas.width = window.innerWidth * 0.75;
        this.canvas.height = this.canvas.width * targetRatio;

        let w = 70, h = 85;
        let centerX = (this.canvas.width - w)/2;
        let centerY = ((this.canvas.height * 0.88) - h);
        myGamePiece = new component(w, h, people_pic[index][0], centerX, centerY, "image");
        myGamePiece.life = 1;

        this.canvas.setAttribute("tabindex", "0");
        this.canvas.style.outline = "none";
        this.canvas.focus();
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        if (!this.interval) {
            this.interval = setInterval(updateGameArea, 20);
        }
        updateGameArea();
        
        // 初始化 Canvas 邊距設定 (配合 Store 按鈕邏輯)
        if (shop.style.display === "block") {
             this.canvas.style.marginTop = "30px";
        } else {
             this.canvas.style.marginTop = "0";
        }
    },
    start : function() {
        showPlayer = true;
        gameRunning = true;
        gamePaused = false;
        updateStateDisplay();
        if (!this.interval) {
            this.interval = setInterval(updateGameArea, 20);
        }
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop : function() {
        if (gameRunning && !gamePaused && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            gamePaused = true;
        }
    },
    reset : function() {
        this.clear();
        score = 0;
        level_speed = 1;
        this.frameNo = 0;
        isDay = true;

        vegetableSet = [];
        toolSet = [];
        cloudSet = [];
        PropsSet = [];

        let w = 46, h = 56;
        let centerX = (this.canvas.width - w)/2;
        let centerY = ((this.canvas.height * 0.88) - h);
        myGamePiece = new component(w, h, people_pic[index][0], centerX, centerY, "image");
        myGamePiece.life = 1;
    }
}

// ==========================================
// 6. 實體物件構造函數 (Entity Constructor)
// ==========================================
function component(width, height, color, x, y, type) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.fall_speed = 0;
    this.life = 0;
    this.type = type;
    this.state = false;
    if (type === "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.update = function() {
        let ctx = myGameArea.context;
        if (type == "image") {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    this.crashWith = function(otherobj) {
        var myleft = this.x;
        var myright = this.x + this.width;
        var mytop = this.y;
        var mybottom = this.y + this.height;
        var otherleft = otherobj.x;
        var otherright = otherobj.x + otherobj.width;
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + otherobj.height;
        return !(mybottom < othertop || mytop > otherbottom || myright < otherleft || myleft > otherright);
    }
}

// ==========================================
// 7. 遊戲主迴圈 (Main Loop)
// ==========================================
function updateGameArea() {
    myGameArea.clear();

    let ctx = myGameArea.context;
    // 繪製背景
    let grd = ctx.createLinearGradient(0, 0, 0, myGameArea.canvas.height);
    grd.addColorStop(0,"rgba(209, 223, 231, 1)");
    grd.addColorStop(0.4,"#46cbddff");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height * 0.85);

    ctx.fillStyle = "#89cc85ff";
    ctx.fillRect(0,myGameArea.canvas.height * 0.85,myGameArea.canvas.width,myGameArea.canvas.height * 0.15);

    if (gameState === "intro") {
        introFrame++;

        let ctx = myGameArea.context;
        let grd = ctx.createLinearGradient(0, 0, 0, myGameArea.canvas.height);
        grd.addColorStop(0,"rgba(209, 223, 231, 1)");
        grd.addColorStop(0.4,"#46cbddff");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height * 0.85);
        ctx.fillStyle = "#89cc85ff";
        ctx.fillRect(0,myGameArea.canvas.height * 0.85,myGameArea.canvas.width,myGameArea.canvas.height * 0.15);

        if (introFrame >= 50 && introFrame <= 150 && everyintro(2)) {
            let W = 30;
            const randomSpeed = (Math.random() * 0.03) + 0.01; 
            let x = Math.floor(Math.random() * (myGameArea.canvas.width - W + 1));
            let carrot = new component(W, W, "assets/picture/carrot.png", x, -30, "image");
            carrot.fall_speed = randomSpeed;
            vegetableSet.push(carrot);
            let x2 = Math.floor(Math.random() * (myGameArea.canvas.width - W + 1));
            let cabbage = new component(W, W, "assets/picture/cabbage.png", x2, -30, "image");
            cabbage.fall_speed = randomSpeed; 
            vegetableSet.push(cabbage);
        }
        for (let v of vegetableSet) { 
            v.y += myGameArea.canvas.height * v.fall_speed; 
            v.update(); 
        }

        let alpha = 1.0; 
        if (introFrame <= 50) {
            alpha = introFrame / 50; 
        }
        ctx.globalAlpha = alpha; 

        const centerX = myGameArea.canvas.width / 2;
        const targetY = myGameArea.canvas.height / 2;
        let textY = Math.min(100 + introFrame * 6, targetY);
        if (introFrame > 200) {
            ctx.globalAlpha = 1.0; 
            vegetableSet = [];
            myGamePiece.update();
            gameState = "ready";
            introFrame = 0;
            myGameArea.stop();
            updateStateDisplay();
        }

        ctx.font = "50px Noto Sans CJK TC";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const logoSize = 85;
        const text = "蔬菜大作戰"; 
        const combinedStartX = centerX - logoSize * 3.5; 
        const colors = ["#ffa600ff", "#ffa600ff", "#ffffffff", "#439724ff", "#439724ff"];

        if (!this.introLogo) { this.introLogo = new component(logoSize, logoSize, "assets/picture/carrot.png", 0, 0, "image");}
        this.introLogo.x = combinedStartX; 
        this.introLogo.y = textY - logoSize / 2;
        this.introLogo.update();
        if (!this.introLogo2) { this.introLogo2 = new component(logoSize, logoSize, "assets/picture/cabbage.png", 0, 0, "image");}
        this.introLogo2.x = combinedStartX + 6 * logoSize; 
        this.introLogo2.y = textY - logoSize / 2;
        this.introLogo2.update();

        for (let i = 0; i < text.length; i++) {
            ctx.fillStyle = colors[i];
            const charCenterX = combinedStartX + (i * logoSize) + logoSize * 3 / 2; 
            ctx.fillText(text[i], charCenterX, textY);
        }
        
        ctx.globalAlpha = 1.0; 

        return;
    }
    // 未開始狀態
    if (!gameRunning) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("點擊START開始", myGameArea.canvas.width / 2, myGameArea.canvas.height / 2);
        myGamePiece.update();
        return;
    }

    // 暫停狀態
    if (gamePaused) {
        myGamePiece.update();
        for (let v of vegetableSet) v.update();
        for (let c of cloudSet) c.update();
        for (let r of toolSet) r.update();
        for (let p of PropsSet) p.update();
        return;
    }

    // 遊戲進行邏輯：碰撞檢測
    for (let i = 0; i < vegetableSet.length; i++) {
        for(let j = 0; j < toolSet.length; j++) {
            if (toolSet[j].crashWith(vegetableSet[i])) {
                toolSet.splice(j, 1); j--;
                if(index == 2){ vegetableSet[i].life -= 3;}
                else {vegetableSet[i].life -= 1;}
                if (vegetableSet[i].life <= 0){
                    score += 10;
                    vegetableSet.splice(i, 1); i--;
                    break;
                }
            }
        }
        // 蔬菜落地檢測 (Game Over)
        if (vegetableSet[i] && vegetableSet[i].y + vegetableSet[i].height >= myGameArea.canvas.height * 0.85) {
            myGamePiece.image.src = people_pic[index][1];
            myGamePiece.life = 0;
            gameRunning = false;
            gamePaused = false;
            gameState = "die";
            money += score / 10;
            updateStateDisplay();
        }
    }
    //撿拾道具
    for(let i = 0; i < PropsSet.length; i++){
        if(myGamePiece.crashWith(PropsSet[i])) {
            money += 5;
            updateStateDisplay();
            PropsSet.splice(i, 1);
            i--;
            break;
            }
        if(PropsSet[i].y > myGameArea.canvas.height + 30){
            PropsSet.splice(i, 1);
            i--;
            break;
        }
    }
    // 生成雲朵
    if(everyinterval(160)) {
        let cloudW = 60;
        let Y = Math.floor(Math.random() * (cloudW * 2 + 1));
        cloudSet.push(new component(cloudW, cloudW, "assets/picture/cloud.png", myGameArea.canvas.width + cloudW, Y, "image"));
    }
    for (let c of cloudSet) { c.x -= myGameArea.canvas.width * cloud_speed; c.update(); }
    
    // 切換夜晚
    if(!isDay) {
        let grd = ctx.createLinearGradient(0, 0, 0, myGameArea.canvas.height);
        grd.addColorStop(0.0, "#29334A"); 
        grd.addColorStop(0.4, "#4E5B82"); 
        grd.addColorStop(0.85, "#494D57"); 
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height * 0.85);

        if(!starsInitialized) {
            const numStars = 100;
            let starW = 2;
            for (let i = 0; i < numStars; i++) {
                let x = Math.random() * myGameArea.canvas.width;
                let y = Math.random() * (myGameArea.canvas.height * 0.85); 
                let newStar = new component(starW, starW, "white", x, y, ""); 
                staticStarSet.push(newStar);
            }
            starsInitialized = true; 
        }
        if(everyinterval(10)) {
            const numToGenerate = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numToGenerate; j++) {
                let starW = 4;
                let x = Math.random() * myGameArea.canvas.width;
                let newStar = new component(starW, starW, "white", x, -starW, ""); 
                newStar.fall_speed = (Math.random() * 0.015) + 0.005; 
                starSet.push(newStar);
            }        
        }
        for(let i = 0; i < starSet.length; i++) {
            let star = starSet[i];
            star.y += myGameArea.canvas.height * star.fall_speed; 
            star.update(); 

            if (star.y > myGameArea.canvas.height * 0.85) {
                starSet.splice(i, 1);
                i--;
            }
        }

        for(let s of staticStarSet) {s.update();}
    }

    // 繪製分數與幀數
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("score:" + score, 50, 30);
    // ctx.fillText(myGameArea.frameNo, myGameArea.canvas.width * 0.9, 30);

    myGamePiece.update();

    myGameArea.frameNo += 1;
    if(everyinterval(1000)){
        level_speed += difficulty;
        updateStateDisplay();
    }

    // 生成高麗菜
    if (myGameArea.frameNo == 1 || everyinterval(75)) {
        let cabbageW = 40;
        let x = Math.floor(Math.random() * (myGameArea.canvas.width - cabbageW + 1));
        let cabbage = new component(cabbageW, cabbageW, "assets/picture/cabbage.png", x, -40, "image");
        cabbage.fall_speed = (Math.floor(Math.random() * 21 + 10)) / 10000;
        cabbage.life = 1;
        vegetableSet.push(cabbage);
    }

    // 生成胡蘿蔔
    if (myGameArea.frameNo >= 2000 && everyinterval(250)) {
        let carrotW = 60;
        let x = Math.floor(Math.random() * (myGameArea.canvas.width - carrotW + 1));
        let carrot = new component(carrotW, carrotW, "assets/picture/carrot.png", x, -60, "image");
        carrot.fall_speed = (Math.floor(Math.random() * 6 + 5)) / 10000;
        carrot.life = 3;
        vegetableSet.push(carrot);
    }

    // 生成金幣
    if(glod_moneyBtn.style.border){
        if (everyinterval(150)) {
            let glod_moneyW = 30;
            let x = Math.floor(Math.random() * (myGameArea.canvas.width - glod_moneyW + 1));
            let glod_money = new component(glod_moneyW, glod_moneyW, "assets/picture/glod_money.png", x, -30, "image");
            glod_money.fall_speed = (Math.floor(Math.random() * 21 + 19)) / 10000;
            PropsSet.push(glod_money);
        }
    }
    
    if(everyinterval(1000)){
        isDay = (isDay == true)? false : true;
    }

    // 移動所有物件
    for (let v of vegetableSet) { v.y += myGameArea.canvas.height * v.fall_speed * level_speed; v.update(); }
    for (let r of toolSet) { r.y -= myGameArea.canvas.height * shoot_speed; r.update(); }
    for (let p of PropsSet) { p.y += myGameArea.canvas.height * p.fall_speed; p.update(); }
    
}

// ==========================================
// 8. 輸入控制 (Input Handling)
// ==========================================

// 滑鼠控制
myGameArea.canvas.addEventListener("mousedown", function(e){
    if(gameRunning){
        myGamePiece.state = true;
        myGamePiece.x = getCanvasX(e) - myGamePiece.width / 2;
        myGameArea.canvas.style.cursor = "none";
    }
});
myGameArea.canvas.addEventListener("mousemove", function(e){
    if(gameRunning){
        if(myGamePiece.state){
            myGamePiece.x = getCanvasX(e) - myGamePiece.width / 2;
        }
    }
});
myGameArea.canvas.addEventListener("mouseup", function(e){
    if(gameRunning){
        myGamePiece.state = false;
    }
    myGameArea.canvas.style.cursor = "default";
});
myGameArea.canvas.addEventListener("mouseleave", function(){
    if(gameRunning){
        myGamePiece.state = false;
    }
    myGameArea.canvas.style.cursor = "default";
});

// 鍵盤控制 (射擊)
myGameArea.canvas.addEventListener("keyup", function(e) {
    if (e.key == " " && gameRunning) {
        const now = Date.now();
        if (now - lastShootTime >= shootCooldown) {
            toolSet.push(new component(20, 40, tool_pic[index], myGamePiece.x, myGamePiece.y, "image"));
            if(index == 1){
                toolSet.push(new component(20, 40, tool_pic[index], myGamePiece.x + 50, myGamePiece.y, "image"));
                toolSet.push(new component(20, 40, tool_pic[index], myGamePiece.x - 50, myGamePiece.y, "image"));
            }
            lastShootTime = now;
            myGamePiece.image.src = "assets/picture/people_haha.png";
            setTimeout(() => { 
                myGamePiece.image.src = (gameState == "die")? people_pic[index][1] :people_pic[index][0];
            }, shootDuration);
        }
    }
});

// ==========================================
// 9. UI 事件與商店邏輯 (UI Logic)
// ==========================================

// 裝備切換與購買邏輯
rakeBtn.addEventListener("click", () => {
    if(gameRunning == false){
        index = 0;
        rakeBtn.style.border = "2px solid rgb(142, 142, 142)";
        t_rakeBtn.style.border = "none";
        shovelBtn.style.border = "none";
        updateStateDisplay();
    }
});

t_rakeBtn.addEventListener("click", () => {
    if(gameRunning == false){
        if (t_rakeBtn.style.backgroundColor === "rgba(115, 115, 115, 0.3)") {
            index = 1;
            rakeBtn.style.border = "none";
            t_rakeBtn.style.border = "2px solid rgb(142, 142, 142)";
            shovelBtn.style.border = "none";
            updateStateDisplay();
        }
        else {
            if (money >= 100) {
                money -= 100;
                t_rakeBtn.style.backgroundColor = "rgba(115, 115, 115, 0.3)";
                index = 1;
                rakeBtn.style.border = "none";
                t_rakeBtn.style.border = "2px solid rgb(142, 142, 142)";
                shovelBtn.style.border = "none";
                updateStateDisplay();
                alert("購買成功");
            } else {
                alert("金錢不足");
            }
        }
    }
});

shovelBtn.addEventListener("click", () => {
    if(gameRunning == false){
        if (shovelBtn.style.backgroundColor === "rgba(115, 115, 115, 0.3)") {
            index = 2;
            rakeBtn.style.border = "none";
            t_rakeBtn.style.border = "none";
            shovelBtn.style.border = "2px solid rgb(142, 142, 142)";
            updateStateDisplay();
        }
        else {
            if (money >= 50) {
                money -= 50;
                shovelBtn.style.backgroundColor = "rgba(115, 115, 115, 0.3)";
                index = 2;
                rakeBtn.style.border = "none";
                t_rakeBtn.style.border = "none";
                shovelBtn.style.border = "2px solid rgb(142, 142, 142)";
                updateStateDisplay();
                alert("購買成功");
            } else {
                alert("金錢不足");
            }
        }
    }
    
});
glod_moneyBtn.addEventListener("click", () => {
    if(gameRunning == false){
        if (glod_moneyBtn.style.backgroundColor === "rgba(115, 115, 115, 0.3)") {
            glod_moneyBtn.style.border = (glod_moneyBtn.style.border == "")? "2px solid rgb(142, 142, 142)": "";
        }
        else {
            if (money >= 30) {
                money -= 30;
                glod_moneyBtn.style.backgroundColor = "rgba(115, 115, 115, 0.3)";
                glod_moneyBtn.style.border = "2px solid rgb(142, 142, 142)";
                updateStateDisplay();
                alert("購買成功");
            } else {
                alert("金錢不足");
            }
        }
    }
});

// 遊戲控制按鈕
startBtn.addEventListener("click", () => {
    shop.style.display = "none";
    if (!gameRunning) {
        // 角色死亡 → 重置
        myGameArea.reset();
        myGameArea.start();

        gameState = "playing";
        updateStateDisplay();
        // 初始雲朵 
        cloudSet.push(new component(60,60,"assets/picture/cloud.png", myGameArea.canvas.width*0.1,50,"image"));
        cloudSet.push(new component(60,60,"assets/picture/cloud.png", myGameArea.canvas.width*0.35,120,"image"));
        cloudSet.push(new component(60,60,"assets/picture/cloud.png", myGameArea.canvas.width*0.6,10,"image"));
        cloudSet.push(new component(60,60,"assets/picture/cloud.png", myGameArea.canvas.width*0.8,180,"image"));
        updateStateDisplay();
        return;
    }
    // 暫停 → 繼續
    if (gamePaused) {
        myGameArea.start();
        gameState = "playing";
        updateStateDisplay();
        return;
    }
});

stopBtn.addEventListener("click", () => {
    shop.style.display = "none";
    if (myGamePiece.life > 0 && gameRunning && !gamePaused) {
        myGameArea.stop();
        gameState = "pause"; 
        updateStateDisplay();
    }
});

resetBtn.addEventListener("click", () => {
    shop.style.display = "none";
    myGameArea.stop();
    gamePaused = false;
    gameRunning = false;

    myGameArea.reset();
    updateGameArea();

    gameState = "ready";
    updateStateDisplay();
});

// 商店開關
storeBtn.addEventListener("click", () => {
    if (shop.style.display === "none") {
        shop.style.display = "block";
        document.body.style.overflowY = "auto";
        myGameArea.canvas.style.marginTop = "30px"; 
    } else {
        shop.style.display = "none";
        document.body.style.overflowY = "hidden";
        myGameArea.canvas.style.marginTop = "0";
    }
});

diffBtn.addEventListener("click", () => {
    if(!gameRunning) {
        if(diffBtn.textContent.trim() === "normal") {
            diffBtn.textContent = "hard";
            difficulty = 2;
        }
        else if(diffBtn.textContent.trim() === "hard") {
            diffBtn.textContent = "easy";
            difficulty = 0.5;
        }
        else if(diffBtn.textContent.trim() === "easy") {
            diffBtn.textContent = "normal";
            difficulty = 1;
        }
    }
});
// 初始化頁面樣式

document.body.style.overflowY = "hidden";
