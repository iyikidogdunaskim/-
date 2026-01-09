$(document).ready(function() {
  // #region Dom Elements
  let $music = null;
  let $snowflakes = null;
  // #endregion

  // #region Animations
  const manager = new AnimationManager();
  // #endregion

  // #region Params
  let access_token = null;
  let fileId = null;
  let tokenClient = null;

  let gapiInited = false;
  let gisInited = false;
  let fileRead = false;
  const FILE_NAME = `31body.html`;

  const CLIENT_ID = '1004280494239-6gq6o9cj2f1hnfvlj8gtaau1rkjdeoss.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyDWgrMTLb2iygiApN18mtNiGfZlpk0pA0E';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file';

  var mehmetObj = null;
  let $activeSlide = null;
  let activeSlideId = "scLanding";
  let STARS = [
    {
      icon: 'assets/icons/star-dot.svg',
      count: 15,
      size: 2,
      class: ''
    },
    {
      icon: 'assets/icons/star-dot.svg',
      count: 50,
      size: 3,
      class: ''
    },
    {
      icon: 'assets/icons/star-dot.svg',
      count: 10,
      size: 4,
      class: ''
    },
    {
      icon: 'assets/icons/star-spark.svg',
      count: 8,
      size: 6,
      class: ''
    },
    // {
    //   icon: 'assets/icons/moon.svg',
    //   count: 1,
    //   size: 100,
    //   class: 'moon'
    // },
    // {
    //   icon: 'assets/icons/sparkles.svg',
    //   count: 2,
    //   size: 8,
    //   class: ' glow-strong'
    // },
  ];
  let SNOWFLAKES = [
    {
      icon: 'assets/icons/snowflake.svg',
      count: 55,
      size: 2,
      class: ''
    },
    {
      icon: 'assets/icons/snowflake.svg',
      count: 20,
      size: 4,
      class: ''
    },
    {
      icon: 'assets/icons/snowflake.svg',
      count: 15,
      size: 6,
      class: ''
    },
    {
      icon: 'assets/icons/snowflake.svg',
      count: 10,
      size: 8,
      class: ''
    }
  ];
  let clickThreshold = 3;
  let index = 0;
  let started = false;

  let typeTimeout = null;
  let shootStarTimeout = null;

  let documentClickEnabled = true;

  let activeIndex = 0;
  let typewriterIndex = 0;
  
  let objectList = [];

  const REQUIRED_PRESSES = 15;
  let pressCount = 0;
  let launchEnabled = false;
  let rocketLaunched = false;
  
  let giftEnabled = false;
  //const tearSound = new Audio('assets/sounds/tear.mp3');
  //const openSound = new Audio('assets/sounds/open.mp3');
  // #endregion

  // #region Functions
  function registerHandlers() {
    setMusic("#bg-music");
    // #region Handlers
    $(document).on('click', function (e) {
      if(!documentClickEnabled && !Util.DEBUG && !Util.PREPROD) {
        return;
      }
      if(!Util.isLandscape()) {
        return;
      }
      if(!Util.DEBUG && !Util.isEffectivelyFullscreen()) {
        Util.openFullscreen();
        return;
      }

      // ekran boyutuna duyarli olmasi icin.
      // console.log('[body][click] ', e.clientX, window.innerWidth, 
      //           '\r\nİLERİ', (window.innerWidth / 2 + window.innerWidth / clickThreshold), 
      //           '\r\nGERİ', (window.innerWidth / 2 - window.innerWidth / clickThreshold), 
      //           '\r\n',started, e);

      if (e.clientX > (window.innerWidth / 2 + window.innerWidth / clickThreshold)) {
        if (index < $(".slide").length - 1) {
          index++;
          showSlide(index);
        }
      } 
      // else if (e.clientX < (window.innerWidth / 2 - window.innerWidth /clickThreshold)) {
      //   if (index > 0) {
      //     index--; 
      //     showSlide(index);
      //   }
      // }
    });
    $(document).on("click", "#muteBtn", function (e) {
      if (started) {
        $music.pause();
        started = false;
      } 
      else {
        $music.play();
        started = true;
      }
      $(this).text(!started ? "🔇" : "🔊");
    });
    $(document).on("click", "#rocket", function (e) {
      if (rocketLaunched || !launchEnabled) {
        return;
      }

      pressCount++;
      shakeBody(pressCount);
      Util.vibrate(20);

      if (pressCount >= REQUIRED_PRESSES-5) {
        //$('#rocket').addClass('pulse');
      }
      if (pressCount < REQUIRED_PRESSES) {
        return;
      }

      launchRocket();
    });
    $(document).on("click", "#gift", function (e) {
      if (!giftEnabled) {
        return;
      }

      pressCount++;
      //tearSound.currentTime = 0;
      //tearSound.play();
      shakeGift(pressCount);
      Util.vibrate(20);

      if(Util.DEBUG) {
        openGift();  
        setMusic("#music-acapella", 0.2, 5000); 
      }
      spawnConfetti(e.clientX, e.clientY);

      if (pressCount >= REQUIRED_PRESSES-5) {
        //$('#rocket').addClass('pulse');
      }
      if (pressCount < REQUIRED_PRESSES) {
        return;
      }

      openGift();
    });
    // #endregion
  }
  // --- Google Drive API ---
  async function initGoogleDrive() {
    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
          console.log('[oauth2.initTokenClient][callback] Token client callback response:', resp);
          if (resp.error) {
            console.error('[oauth2.initTokenClient][callback] Error getting access token:', resp.error);
            return;
          }

          access_token = resp.access_token;
          $('#drive-warning').addClass('d-none');

          console.log('[oauth2.initTokenClient][callback] New access token received and saved.');
          
          await loadFromGoogleDrive();
        },
        error_callback: (error) => {
          console.log('[oauth2.initTokenClient][error_callback] Error: ', error);
          return;
        }
      });
      
      gisInited = true;

      await new Promise((resolve, reject) => {
        gapi.load('client', {
          callback: (response) => {
            resolve();
          },
          onerror: (error) => {
            console.error('[initGoogleDrive][gapi.load][onerror] Promise: Error loading Drive API client:', error);
            reject(error);
          }
        });
      });

      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
      });

      console.log('[initGoogleDrive][gapi.client.init] Drive API initialized successfully.');

      gapiInited = true;

      await requestNewToken();
      return;

      await loadFromGoogleDrive();
    } catch (error) {
      console.error('Error during Google Drive initialization:', error);
      fileRead = false;
    }
  }

  async function requestNewToken() {
    return new Promise((resolve, reject) => {
      tokenClient.requestAccessToken();
    });
  }

  async function loadFromGoogleDrive() {
    try {
      fileRead = false;
      
      if (!access_token) {
        console.log('[loadFromGoogleDrive] Hayır access token, requesting new token');
        await requestNewToken();
        return;
      }
    
      console.log('[loadFromGoogleDrive]', FILE_NAME, 'File search started.');
      const response = await gapi.client.drive.files.list({
        q: `name='${FILE_NAME}' and trashed=false`,
        fields: 'files(id, name)',
        access_token: access_token
      });
      
      console.table(response?.result?.files);

      if (!(response?.result?.files?.length > 0)) {
        console.log('[loadFromGoogleDrive] No existing file found in Drive.');
        return;
      }

      console.log('[loadFromGoogleDrive] File found in Drive:', response.result.files[0].name);
      fileId = response.result.files[0].id;
      
      const contentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': 'Bearer ' + access_token
        }
      });

      if (!contentResponse.ok) {
        console.log('[loadFromGoogleDrive] Could not read file from Drive.');
        return;
      }

      //const data = await contentResponse;
      fileRead = true;  

      if(!isNullOrEmpty(timeOut)) {
        clearTimeout(timeOut);
      }
      
      registerHandlers();
        
      console.log('[loadFromGoogleDrive] Data loaded successfully from Drive: ', contentResponse);
       
    } catch (error) {
      console.error('[loadFromGoogleDrive] Error:', error);
      if (error.status === 401) {
        logOut();
        await requestNewToken();
      } else {
        loadFromLocalStorage();
        setAllDatas();
      }
    }
  }

  function openGift() {
    const giftBox = document.getElementById('gift');
    giftEnabled = false;
    pressCount = 0;
    //openSound.play();

    giftBox.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.2)', opacity: 0 }
      ], { duration: 1200, easing: 'ease-out' });

    const rect = giftBox.getBoundingClientRect();
    spawnConfetti(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5, 55, 3);

    setTimeout(() => {
      giftBox.remove();
      $('#giftText').fadeIn(2000);

      addBtnIleriPulse();
    }, 1000);
  }

  function spawnConfetti(x, y, count = 25, Speed = 4) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';

      el.style.left = x + 'px';
      el.style.top = y + 'px';

      el.style.background = `hsl(${Math.random()*360},80%,60%)`;

      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * Speed;

      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed - 3;

      let life = 60;

      function tick() {
        vy += 0.15;
        el.style.left = el.offsetLeft + vx + 'px';
        el.style.top  = el.offsetTop + vy + 'px';
        life--;

        if (life > 0) requestAnimationFrame(tick);
        else el.remove();
      }
      tick();
    }
  }

  function shakeGift(pressCount) {
    $('#gift').addClass('giftShake');

    setTimeout(() => {
      $('#gift').removeClass('giftShake');
    }, pressCount * 200);
  }

  function shakeBody(pressCount) {
    $('#scene-discovery .scene-inner').addClass('shake');

    setTimeout(() => {
      $('#scene-discovery .scene-inner').removeClass('shake');
    }, pressCount * 200);
  }
  // SNOW
  function spawnSnowFlakes() {
    $snowflakes = $('#snowflakes');
    $('.snowflake').remove();
    objectList = [];
    SNOWFLAKES.forEach((row, index) => {
      for (let i = 0; i < row.count; i++) {
        const $snowflake = $(`<img src="${row.icon}" class="snowflake moving-obj ${row.class}"/>`);
        
        const x = Util.random(5, window.innerWidth - 5);
        const y = Util.random(-25, 0);
        $snowflake.css({
          top: `${y}px`,
          left: `${x}px`,
          width: row.size,
          height: row.size,
        });
        $snowflakes.append($snowflake);
        objectList.push(new Obj({ el: $snowflake[0], x, y, size: row.size, 
                                speedX: Util.randomFloat(-0.3, 0.3),
                                speedY: Util.DEBUG ? Util.randomFloat(2, 3) : Util.randomFloat(0.1, 1.2)
                              }));
      } 
    });
    
    manager.add(new Snow(objectList)).start();
  }

  // STARS
  function spawnStars() {
    $('.star').remove();
    objectList = [];
    STARS.forEach((row, index) => {
      for (let i = 0; i < row.count; i++) {
        const $star = $(`<img src="${row.icon}" class="star moving-obj ${row.class}"/>`);
        
        const x = Util.random(5, window.innerWidth-5);
        const y = Util.random(5, window.innerHeight-5);
        $star.css({
          top: `${x}px`,
          left: `${y}px`,
          width: row.size,
          height: row.size,
        });
        $('#stars').append($star);
        objectList.push(new Obj({ el: $star[0], x, y, size: row.size }));
      } 
    });
    
    manager.add(new DriftStars(objectList, Util.DEBUG ? 0.3 : 0.01, Util.DEBUG ? -0.5 : -0.1)).start();
  }

  function shootStar() {
    const star = $('.shooting-star');

    const startX = Util.random(50, (window.innerWidth - 200));
    const startY = Util.random(50, (window.innerHeight - 200));
    const distance = Util.random(550, 1500);

    const angleRad = Math.PI / Util.randomFloat(5.1, 6);
    const dx = Math.cos(angleRad) * distance;
    const dy = Math.sin(angleRad) * distance;

    const angleDeg = angleRad * 180 / Math.PI + 90;

    const duration = Util.random(2000, 4000);

    // ensure shooting star is fixed so it doesn't affect layout/scroll
    star.css('position', 'fixed');
    star.stop(true, true)
      .css({
        left: startX,
        top: startY,
        opacity: 1,
        transform: `rotate(${angleDeg}deg)`
      })
      .animate({
        left: startX + dx,
        top: startY + dy,
        opacity: 0
      }, duration);

    shootStarTimeout = setTimeout(shootStar, Util.DEBUG ? duration + 1000 : Util.random(7000, 12000));
  }

  function handleNorthStar() {
    const len = $('#northStar').length;
    if(len > 0) {
      return;
    }
    if (shootStarTimeout) {
      clearTimeout(shootStarTimeout);
      shootStarTimeout = null;
    }  
    
    $('#stars').append(`<img id="northStar" src="assets/icons/star-spark.svg" class="star pulse moving-obj"/>`);  
  }

  function stopTypewriter() {
    if (typeTimeout) {
      clearTimeout(typeTimeout);
      typeTimeout = null;
    }
  }

  function handleMusic(slideIndex) {
    // // Sonsuz düğüm sahnesi (örnek index 3)
    if (activeSlideId == 'saat') {
      fadeVolume(0.1);
    }
    else {
      //fadeVolume(0.5);
    }
  }

  function setMusic(musicId, volume = 0.5, duration = 800) {
    const currentMusicId = $($music)?.attr('id');
    if(currentMusicId) {
      fadeVolume(volume, duration);
      $music.pause();
    }

    if(currentMusicId != musicId) {
      $music = $(musicId)[0];
      $music.volume = 0;
      fadeVolume(volume, duration);
      if(currentMusicId && !Util.DEBUG) {
        $music.play();
      }
    } 
  }

  function fadeVolume(volume, duration = 800) {
    $({ vol: $music.volume }).animate(
      { vol: volume },
      {
        duration,
        step: function (now) {
          $music.volume = now;
        }
      }
    );
  }

  function launchRocket() {
    rocketLaunched = true;
    pressCount = 0;
    $('#scene-discovery .scene-inner').addClass('shake');
    $('#scene-discovery').css({transform: "translateY(100%)"});
    $('#scene-galaxy').css({transform: "translateY(0)"});

    initSlideGalaxy();
  }

  function typeWriter() {
    stopTypewriter();

    const $writers = $activeSlide.find(".typewriter");
    if(typewriterIndex >= $writers.length) {
      typewriterIndex = 0;
      console.log('typeWriter bitti. ', index, activeIndex, activeSlideId);
      //$activeSlide.find('.typewriter').fadeOut(4000);
      
      if(activeSlideId == 'ay') { 
        $('#imgAlien').fadeOut(2000);
        $('#gift').show();
        $('#gift')[0].animate([
          { transform: 'scale(0.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 2000, easing: 'ease-in' });
        giftEnabled = true;
      }
      if(activeSlideId == 'galaxy2') {
        setTimeout(() => {  
          handleNorthStar();
          setTimeout(() => { 
              setActiveSlide('galaxy3');
              showSlide(activeIndex);
            }, 3000);
        }, Util.DEBUG ? 1000 : 1500);
      }
      else if(activeSlideId == 'galaxy3') { 
        if (shootStarTimeout) {
          clearTimeout(shootStarTimeout);
          shootStarTimeout = null;
        }   
        manager.stop('drift');
        manager.stop('float');
        setTimeout(() => {  
          setActiveSlide('galaxy4');
          showSlide(activeIndex);
        }, Util.DEBUG ? 1000 : 1500);    
      }
      else if(activeSlideId == 'galaxy4') {
        setTimeout(() => {             
          setActiveSlide('galaxy5');
          showSlide(activeIndex);    
        }, Util.DEBUG ? 1000 : 1500);
      }
      else if(activeSlideId == 'galaxy5') {
        setTimeout(() => {   
          mehmetObj.rotationSpeed = 1;
          mehmetObj.endScale = 0.25;
          mehmetObj.dist = mehmetObj.size * 0.30;
          console.log('mehmetObj', mehmetObj);

          const $moon = $('#moon');
          $moon.addClass('moving-obj');

          var moonObj = new Obj({ el: $moon[0],
                                  size: $moon[0].width,
                                  speedX: 0.2,
                                  speedY: -0.1,
                                  endScale: 0.0005,
                                  dist: 35,
                                  scaleOffset: 0.00015 });

          objectList.push(mehmetObj);
          objectList.push(moonObj);
          manager.add(new GatherStars(objectList, { target: new Target({ el: $('#northStar')[0] }), pull: Util.DEBUG ? 0.0005 : 0.00005})).start().onFinish(() => {      
            setTimeout(() => {
              manager.get('gather').stars = [mehmetObj];
              objectList.splice(objectList.indexOf(mehmetObj), 1);  
              objectList.splice(objectList.indexOf(moonObj), 1); 
              $moon.remove();       
              setActiveSlide('galaxy6');
              showSlide(activeIndex);  
              manager.add(new DisperseStars(objectList, 0.01)).start().onFinish(() => {   
                manager.start('drift');   
                setTimeout(() => {   
                    setActiveSlide('galaxy7');
                    showSlide(activeIndex);
                  }, 3000);
              });
            }, 5000);
          });
        }, Util.DEBUG ? 1000 : 1500);
      }
      else if(activeSlideId == 'galaxy6') {
      }
      else if(activeSlideId == 'galaxy7') {
        setTimeout(() => {   
          setActiveSlide('galaxy8');
          showSlide(activeIndex);
        }, 2000);
      }
      else if(activeSlideId == 'galaxy8') {
        setTimeout(() => {     
          manager.stop('drift');   
          manager.stop('gather');
          objectList.push(mehmetObj);            
          $('#northStar').removeClass('pulse');
          $('#northStar').addClass('shake');
          manager.add(new InfinityStars(objectList, { target: new Target({ el: $('#northStar')[0] }), 
                                                    shapeSpeed: Util.DEBUG ? 0.005 : 0.002,
                                                    seconds: (Util.DEBUG ? 2 : 10) })).start().onFinish(() => { 
            objectList.forEach(obj => { obj.dist = 0; });
            manager.add(new GatherStars(objectList, { target: new Target({ el: $('#northStar')[0] }), pull: 0.05})).start().onFinish(() => {    
              manager.stop('gather');
              objectList = [];
              //$('.star').remove();
              $('#moon').remove();
              $('#mehmet').remove();               
              manager.add(new EnergyBurst({ target: new Target({ el: $('#northStar')[0] }), 
                                  //shapeSpeed: Util.DEBUG ? 0.003 : 0.001,
                                  //seconds: 15 
                          })).start().onFinish(() => {  
                manager.stopAll();
                initSlideSnow();
              });
            });                                                                
          });
        }, 2000);
      }
      else if(activeSlideId == 'ay') {
      } 
      else if(activeSlideId == 'snow1') {
        $('#knot').fadeIn(3000);
        setTimeout(() => {   
          setActiveSlide('snow2');
          showSlide(activeIndex);
        }, 3500);
      } 
      else if(activeSlideId == 'snow2') {   
        $('#gift').show();
        $('#gift')[0].animate([
          { transform: 'scale(0.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 2000, easing: 'ease-in' });
        giftEnabled = true;
      } 
      else if(activeSlideId == 'snow1') {
      } 
      else if(activeSlideId == 'snow6') {
        //$('#nisaKucuk').fadeIn(3000);
        $('#nisaKucuk').show();
        $('#nisaKucuk')[0].animate([
          { transform: 'scale(0.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 2000, easing: 'ease-in' });
      } 
      else if(activeSlideId != 'uzay') {
        documentClickEnabled = true;
        addBtnIleriPulse();
      }
      return;
    }

    const $el = $writers.eq(typewriterIndex);
    const hide = $el.data("hide");

    let delay = Util.DEBUG ? 25 : Number($el.data("delay"));
    if(delay > 1000) {
      delay = 1000;
    }

    const text = String($el.data("html"));
    $el.html("");

    let i = 0;
    let current = "";

    function type() {
      while (text[i] === "<") {
        const tagEnd = text.indexOf(">", i);
        current += text.slice(i, tagEnd + 1);
        i = tagEnd + 1;
      }
      if (i >= text.length) {
        typewriterIndex++;   
        if(hide) { 
          $el.fadeOut(delay * 10);
        }
        setTimeout(typeWriter, 700);
        return;
      }

      const char = text[i];
      current += char;
      i++;
      $el.html(current);
    
      let timeoutDelay = delay;
      if (char === " ") timeoutDelay = 5;
      if (char === "\n") timeoutDelay = 500;
    
      typeTimeout = setTimeout(type, timeoutDelay);
    }

    type();
  }

  function handleTypeWriter() {
    typewriterIndex = 0;
    $activeSlide.find(".typewriter").html("");
    setTimeout(() => {
        typeWriter();
    }, Util.DEBUG ? 500 : 2000); 
  }

  function initSlideFirst() {  
    if (!started) {
      $music.play();
      started = true;
    }
  }

  function initSlideGalaxy() {
    setActiveSlide('galaxy');
    spawnStars();
    $('#mehmet').remove(); 
    fadeVolume(0, 5700);
    shootStarTimeout = setTimeout(shootStar, Util.DEBUG ? 2000 : Util.random(7000, 12000));
    setTimeout(() => {  
      const moonRect = $('#moon')[0].getBoundingClientRect();      
      const moonRadius = Math.min(moonRect.width, moonRect.height) / 2;
      const moonCenter = { x: moonRect.left + moonRect.width / 2, y: moonRect.top + moonRect.height / 2};
      
      let distance = moonRadius * 1.3;
      const angleRad = -120 * Math.PI / 180;

      manager.add(new Fly(new Obj({ el: $('#rocket')[0], 
                                    angle: 303, 
                                    speed: Util.DEBUG ? 1.5 : 1, 
                                    waveStrength: -0.4, 
                                    rotationSpeed: 0.002, 
                                    endAngle: 268, 
                                    endScale: 0.4 })
      , { target: new Target({ el: $('#moon')[0],
                              distX: Math.cos(angleRad) * distance,
                              distY: Math.sin(angleRad) * distance
                            }) })).start().onFinish(() => {    
        const $mehmet = $(`<img id="mehmet" class="icon float moving-obj" src="assets/icons/astronaut.svg">`);
        const scale = 0.3;
        const width = 55;
        const height = 70;

        const angleRad = -130 * Math.PI / 180;
        const landingTargetMehmet = { 
          x: moonCenter.x + Math.cos(angleRad) * moonRadius,
          y: moonCenter.y + Math.sin(angleRad) * moonRadius
        };
        $('body').append($mehmet); 
        mehmetObj = new Obj({ el: $mehmet[0],
                                    x: landingTargetMehmet.x,
                                    y: landingTargetMehmet.y,
                                    endAngle: 72,
                                    width,                                    
                                    height,
                                    scale,
                                    zIndex: 502,
                                    speedX: 0.2,
                                    speedY: -0.1,
                                    endScale: 1,
                                    dist: 0,
                                    scaleOffset: 0.00015,
                                    rotationSpeed: 0 });

        setTimeout(() => { 
          manager.add(new Fly(new Obj({ el: $('#rocket')[0], 
                                        angle: 269, 
                                        endAngle: 273, 
                                        speed: Util.DEBUG ? 1.5 : 0.8, 
                                        waveStrength: -0.2, 
                                        rotationSpeed: 0.004, 
                                        endScale: 0.6 })
          , { target: new Target({ x: 10, y: -25 }) })).start().onFinish(() => {
            $('#rocket').remove();
            typeWriter();
          });
          manager.add(new FloatObjects([mehmetObj])).start();   
        }, 2000);
      });
    }, 5700);
  }

  function initSlideSnow() {
    $('#scene-snow').css({
      zIndex: 3,
      opacity: 1,
    });      
    $('#navigation').css({color: 'black'});    
  
    setTimeout(() => {  
      setMusic("#music-acapella", 0.1, 5000);       
      $('#energyBurst').remove();                  
      $('#scene-discovery').remove();                                                       
      $('#scene-galaxy').remove();    
      spawnSnowFlakes(); 
      setActiveSlide('snow1');

      setTimeout(() => {       
        showSlide(activeIndex);
      }, 3000); 
    }, 2000);
  }
  
  function setActiveSlide(id) {
    $(".slide").removeClass("active");
    $activeSlide = $('#' + id);
    $activeSlide.addClass("active");
    activeSlideId = id;
    index = $(".slide").index($activeSlide);
    activeIndex = $(".slide").index($activeSlide);
    console.log('[setActiveSlide] ', id, index, activeIndex);    
  }

  function addBtnIleriPulse() {
    documentClickEnabled = true;
    $('.btnIleri').fadeIn(1000);
    setTimeout(() => {
      $('.btnIleri').addClass('pulse');
    }, 2000);
  }

  function removeBtnIleriPulse() {
    documentClickEnabled = false;
    $('.btnIleri').removeClass('pulse');
    $('.btnIleri').fadeOut(500);
  }

  function showSlide(i) {
    removeBtnIleriPulse();
    if(i > activeIndex) {
      if(i == 1) {
        initSlideFirst();
      }
      if(activeSlideId == 'uzay') {
        index--;  
        return;
      } 
    } else {
      if(activeSlideId == 'galaxy') {
        index++;  
        return;
      }
    }

    stopTypewriter();
    $(".slide").removeClass("active");
    $activeSlide = $(".slide").eq(i).addClass("active");
    activeSlideId = $activeSlide.attr('id');
    $('#rocket').remove();
    launchEnabled = false;
    if(activeSlideId == 'ates') {
      $('.icon.fire').animate({ opacity: 1 }, 15000, 'linear');
    }
    else if(activeSlideId == 'uzay') {
      const $rocket = $(`<img id="rocket" class="icon moving-obj" src="assets/icons/rocket.svg">`);
      $('body').append($rocket); 
      manager.add(new Fly(new Obj({ el: $rocket[0], 
                                    x: -120,
                                    y: window.innerHeight - 100,
                                    angle: 32, 
                                    speed: Util.DEBUG ? 5 : 1, 
                                    waveStrength: -0.02,  
                                    rotationSpeed: 0.0002,
                                    finalRotationSpeed: 0.005, 
                                    endAngle: 303 })
        , { target: new Target({ x: window.innerWidth / 2, y: window.innerHeight * 0.80 }) })).start().onFinish(() => {     
        launchEnabled = true;
        shakeBody(2);
      });
    }

    console.log('[showSlide] ', i, activeIndex, activeSlideId);

    handleTypeWriter();
    handleMusic(i);
    activeIndex = index;
  }
  
  if(Util.DEBUG) 
  {   
    removeBtnIleriPulse();

    handleNorthStar();
    $('#scene-discovery').css({transform: "translateY(100%)"});
    $('#scene-galaxy').css({transform: "translateY(0)"});
    initSlideSnow();
    setTimeout(() => {  
      manager.add(new EnergyBurst({ target: new Target({ el: $('#northStar')[0] }), 
                                  //shapeSpeed: Util.DEBUG ? 0.003 : 0.001,
                                  //seconds: 15 
                  })).start().onFinish(() => {  
        manager.stopAll();
        initSlideSnow();
      });
    }, 5700);

     
    // const $rocket = $(`<img id="rocket" class="icon moving-obj" src="assets/icons/rocket.svg">`);
    // $rocket.css({
    //   left: window.innerWidth / 2, 
    //   top: window.innerHeight * 0.80
    // });
    // $('body').append($rocket); 

    // rocketLaunched = true;
    // $('#scene-discovery .scene-inner').addClass('shake');
    // $('#scene-discovery').css({transform: "translateY(100%)"});
    // $('#scene-galaxy').css({transform: "translateY(0)"});
    // initSlideGalaxy();
  }

  //registerHandlers();

  if ((typeof google !== 'undefined' && google.accounts?.oauth2)) {
    clearInterval(checkGoogle);
    (async function () {
      await initGoogleDrive();
    })();
    return;
  }

  let tryCount = 0;
  var checkGoogle = setInterval(function() {
    tryCount++;
    if (tryCount > 3) {
      clearInterval(checkGoogle);
      return;
    }
    if ((typeof google !== 'undefined' && google.accounts?.oauth2)) {
      clearInterval(checkGoogle);
      (async function () {
        await initGoogleDrive();
      })();
    }
  }, 5000);
  // #endregion
});
