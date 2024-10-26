class Game extends Phaser.Scene {
  constructor() {
    super({
      key: "Game",
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
    });

    this.configure();
  }
  configure() {
    this.screen = "home";

    this.score = localStorage.getItem("axa-bird-game-score");

    if (this.score === null) {
      this.score = 0;
    }

    this.highScore = localStorage.getItem("axa-bird-game-highScore");

    if (this.highScore === null) {
      this.highScore = 0;
    }

    this.remember = localStorage.getItem("axa-bird-game-remember");

    if (this.remember === null) {
      this.remember = false;

      this.username = null;

      this.email = null;

      this.news = null;
    } else if (this.remember) {
      this.username = localStorage.getItem("axa-bird-game-username");

      this.email = localStorage.getItem("axa-bird-game-email");

      this.news = localStorage.getItem("axa-bird-game-news");
    }

    this.codes = [];

    this.unlocked = null;

    this.soundOn = true;

    this.socket = new io();

    this.socket.on("userData", (data) => {
      if (data.codes) {
        try {
          const codes = JSON.parse(data.codes);
          if (Array.isArray(codes)) {
            this.codes = codes.sort((a, b) => a.points - b.points);
          }
        } catch (err) {
          console.log(err);
        }
      }
    });

    if (this.username) {
      this.socket.emit("userData", { username: this.username });
    }

    this.socket.on("usernameTaken", () => {
      this.notify(3);
    });

    this.socket.on("newUser", (data) => {
      if (data.remember) {
        this.username = data.username;

        this.email = data.email;

        localStorage.setItem("axa-bird-game-username", this.username);

        localStorage.setItem("axa-bird-game-email", this.email);

        localStorage.setItem("axa-bird-game-news", this.news);

        localStorage.setItem("axa-bird-game-remember", this.remember);
      }

      this.screen = "leaderboard";

      this.scene.restart();
    });

    this.socket.on("leaderboard", (data) => {
      this.loader.style.display = "none";

      this.addLeaderboardUI(data);
    });
  }
  preload() {
    this.numOfProducts = 1;
    this.load.setBaseURL("assets");
    this.load.plugin(
      "rexroundrectangleplugin",
      "plugins/rexroundrectangleplugin.min.js",
      true
    );
    this.load.image("UIBackground", "backgrounds/UIBackground.jpg");
    this.load.image("background", "backgrounds/background.png");
    this.load.image("logo", "UI/background-logo.png");
    this.load.image("play", "UI/play-button.png");
    this.load.image("ball", "player/ball.png");
    this.load.image("player", "player/ball.png");
    this.load.image("heart", "player/heart.png");
    this.load.image("heart-filled", "player/heart-filled.png");
    this.load.image("emitte", "player/emitte.png");
    this.load.image("trampoline", "collectibles/trampoline.png");
    this.load.image("star", "collectibles/star.png");
    this.load.image("home", "UI/home-icon.png");
    this.load.image("info", "UI/info.png");
    this.load.image("infoIcon", "UI/info-icon.png");
    this.load.image("userIcon", "UI/user-icon.png");
    this.load.image("soundOn", "UI/soundon-button.png");
    this.load.image("soundOff", "UI/soundoff-button.png");
    this.load.image("unlockedIcon", "UI/unlocked-icon.png");
    this.load.image("leaderboardIcon", "UI/leaderboard-icon.png");
    this.load.image("leaderboardGold", "UI/gold.png");
    this.load.image("leaderboardSilver", "UI/silver.png");
    this.load.image("leaderboardBronze", "UI/bronze.png");
    this.load.image("copyIcon", "UI/copy.png");
    this.load.image("hoop1", "platforms/hoop1.png");
    this.load.image("hoop2", "platforms/hoop2.png");
    this.load.image("bacteria1", "bacterias/bacteria1.png");
    this.load.image("bacteria2", "bacterias/bacteria2.png");
    this.load.image("bacteria3", "bacterias/bacteria3.png");
    this.load.image("bacteria4", "bacterias/bacteria4.png");
    this.load.image("bacteria5", "bacterias/bacteria5.png");

    for (let i = 1; i <= this.numOfProducts; ++i) {
      this.load.image(`product${i}`, `products/product${i}.png`);
    }

    for (let i = 1; i <= 3; ++i) {
      this.load.image(`enemy${i}`, `enemies/enemy (${i}).png`);
    }

    for (let i = 1; i <= 4; ++i) {
      this.load.image(`cloud${i}`, `clouds/cloud${i}.png`);
    }

    this.load.audio("jump", "sounds/jump.mp3");

    this.load.audio("trampoline", "sounds/trampoline.mp3");

    this.load.audio("product", "sounds/product.mp3");

    this.load.audio("enemy", "sounds/enemy.mp3");

    this.load.audio("lost", "sounds/lost.mp3");
  }
  create() {
    this.checkSocket();
    this.canJump = true;
    this.pointTimes = 1;
    // this.physics.world.createDebugGraphic();
  }
  checkSocket() {
    this.loader = document.querySelector("#loader");

    this.socketInterval = setInterval(() => {
      if (this.socket.connected) {
        clearInterval(this.socketInterval);

        loader.style.display = "none";

        this.addUI();
      }
    }, 50);
  }
  addUI() {
    if (this.screen === "home") {
      this.addHomeUI();
    } else if (this.screen === "restart") {
      this.addRestartUI();
    } else if (this.screen === "replay") {
      this.addReplayUI();
    } else if (this.screen === "info") {
      this.addInfoUI();
    } else if (this.screen === "codes") {
      this.addCodesUI();
    } else if (this.screen === "unlocked") {
      this.addUnlockedUI();
    } else if (this.screen === "leaderboard") {
      this.loader.style.display = "block";

      this.socket.emit("leaderboard");
    }
  }
  addHomeUI() {
    this.UIBackground = this.add
      .image(400, 700, "UIBackground")
      .setScale(1, 0.9);

    this.infoIcon = this.add
      .image(740, 55, "infoIcon")
      .setScale(0.4)
      .setInteractive();

    this.infoIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.infoIcon,
        scale: 0.5,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.infoIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              this.screen = "info";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.logo = this.add.image(400, 230, "logo").setScale(1);

    this.titleText = this.add
      .text(
        400,
        550,
        "Jump and Pass throw hoops and\ncollect PROVIVA products. Unlock\nhidden offers in the Rabble cash\n back app the higher score you\nget.",
        {
          fontFamily: "Arial",
          fontSize: "36px",
          color: "#a000ff",
          // #480880
          align: "center",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    this.optionsContainer = this.add
      .rexRoundRectangle(400, 900, 620, 480, 50, 0xffffff)
      .setDepth(5)
      .setScrollFactor(0);

    this.ballImage = this.add
      .image(630, 690, "ball")
      .setScale(1.2)
      .setDepth(Infinity);
    this.ballImage.angle = 20;

    this.termsText = this.add
      .text(
        400,
        1170,
        "Powered by Md Mahabub. By playing this game you accept these Terms & policies.",
        {
          fontFamily: "RakeslyRG",
          fontSize: "20px",
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.option1 = this.add
      .rexRoundRectangle(400, 830, 520, 100, 50, 0xf7ad19)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.option1Text = this.add
      .text(400, 830, "Unlocked Offers", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.option2 = this.add
      .rexRoundRectangle(400, 945, 520, 100, 50, 0x3e9e79)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.option2Text = this.add
      .text(400, 945, "Leaderboard", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.option3 = this.add
      .rexRoundRectangle(400, 1060, 520, 100, 50, 0x4e316e)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.option3Text = this.add
      .text(400, 1060, "Play Game", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.bestScoreText = this.add
      .text(320, 730, `BEST: ${this.highScore}`, {
        fontFamily: "RakeslyRG",
        fontSize: "36px",
        stroke: "#000",
        strokeThickness: 1,
        color: "#000",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.lastScoreText = this.add
      .text(480, 730, `LAST: ${this.score}`, {
        fontFamily: "RakeslyRG",
        fontSize: "36px",
        stroke: "#000",
        strokeThickness: 1,
        color: "#000",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.divider = this.add
      .rectangle(400, 730, 5, 70, 0xeeeeee)
      .setDepth(6)
      .setScrollFactor(0);

    this.option1.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option1, this.option1Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option1, this.option1Text],
            scale: 1,
            duration: 100,

            onComplete: () => {
              this.screen = "codes";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.option2.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option2, this.option2Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option2, this.option2Text],
            scale: 1,
            duration: 100,

            onComplete: () => {
              this.screen = "leaderboard";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.option3.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option3, this.option3Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option3, this.option3Text],
            scale: 1,
            duration: 100,

            onComplete: () => {
              this.elements = [
                this.UIBackground,
                this.logo,
                this.titleText,
                this.optionsContainer,
                this.ballImage,
                this.termsText,
                this.option1,
                this.option1Text,
                this.option2,
                this.option2Text,
                this.option3,
                this.option3Text,
                this.bestScoreText,
                this.lastScoreText,
                this.divider,
              ];

              this.elements.forEach((element) => {
                element.destroy();
              });

              this.startGame();
            },
          });
        },
      });
    });
  }
  addRestartUI() {
    this.UIBackground = this.add.rectangle(400, 600, 800, 1200, 0xffffff);

    this.homeIcon = this.add
      .image(740, 55, "home")
      .setScale(0.4)
      .setInteractive();

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.3,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.scoreBox = this.add
      .rexRoundRectangle(400, 200, 300, 70, 20, 0x4e316e)
      .setDepth(Infinity)
      .setScrollFactor(0);

    this.scoreImage = this.add
      .image(265, 200, "star")
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setScale(0.9);

    this.scoreText = this.add
      .text(400, 200, this.score, {
        fontFamily: "RakeslyRG",
        fontSize: "40px",
        color: "#fff",
        align: "center",
        stroke: "#fff",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.ballImage = this.add
      .image(400, 100, "logo")
      .setScale(0.3)
      .setDepth(Infinity);

    this.titleText = this.add
      .text(
        400,
        330,
        "Do you want to submit your score? And be\nable to win some nice prizes? The username\nwill be shown on the leaderboard.",
        {
          fontFamily: "RakeslyRG",
          fontSize: "36px",
          color: "#000",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.usernameInput = this.add.dom(400, 470).createElement(
      "input",
      `
      	outline: none;
      	border: none;
      	padding: 0px 30px;
      	width: 450px;
      	height: 90px;
      	font-size: 30px;
      	font-weight: bold;
      	background: #ebf4f5;
      	border-radius: 20px;
      `
    );

    this.usernameInput.node.setAttribute("placeholder", "Username");

    this.usernameInput.node.setAttribute("maxLength", "15");

    this.emailInput = this.add.dom(400, 580).createElement(
      "input",
      `
      	outline: none;
      	border: none;
      	padding: 0px 30px;
      	width: 450px;
      	height: 90px;
      	font-size: 30px;
      	font-weight: bold;
      	background: #ebf4f5;
      	border-radius: 20px;
      `
    );

    this.emailInput.node.setAttribute("placeholder", "Email");

    this.emailInput.node.setAttribute("type", "email");

    this.agreeCheckBox = this.add
      .dom(145, 650)
      .createElement(
        "div",
        `
      	width: 70px;
      	height: 70px;
      	background: #ebf4f5;
      	border-radius: 20px;
      	cursor: pointer;
      `
      )
      .setInteractive()
      .setOrigin(0);

    this.agreeCheckBoxMark = this.add
      .dom(165, 670)
      .createElement(
        "div",
        `
      	width: 30px;
      	height: 30px;
      	background: #000;
      	border-radius: 10px;
      	cursor: pointer;
      `
      )
      .setAlpha(0.6)
      .setVisible(false)
      .setOrigin(0);

    this.agreeText = this.add.text(235, 663, "Agree to terms & conditions?", {
      fontFamily: "RakeslyRG",
      fontSize: "36px",
      color: "#511a73",
      align: "center",
    });

    this.signCheckBox = this.add
      .dom(145, 735)
      .createElement(
        "div",
        `
      	width: 70px;
      	height: 70px;
      	background: #ebf4f5;
      	border-radius: 20px;
      	cursor: pointer;
      `
      )
      .setInteractive()
      .setOrigin(0);

    this.signCheckBoxMark = this.add
      .dom(165, 755)
      .createElement(
        "div",
        `
      	width: 30px;
      	height: 30px;
      	background: #000;
      	border-radius: 10px;
      	cursor: pointer;
      `
      )
      .setAlpha(0.6)
      .setVisible(false)
      .setOrigin(0);

    this.signText = this.add.text(235, 748, "Sign up for newsletter", {
      fontFamily: "RakeslyRG",
      fontSize: "36px",
      color: "#511a73",
      align: "center",
    });

    this.rememberCheckBox = this.add
      .dom(145, 820)
      .createElement(
        "div",
        `
      	width: 70px;
      	height: 70px;
      	background: #ebf4f5;
      	border-radius: 20px;
      	cursor: pointer;
      `
      )
      .setInteractive()
      .setOrigin(0);

    this.rememberCheckBoxMark = this.add
      .dom(165, 840)
      .createElement(
        "div",
        `
      	width: 30px;
      	height: 30px;
      	background: #000;
      	border-radius: 10px;
      	cursor: pointer;
      `
      )
      .setAlpha(0.6)
      .setVisible(false)
      .setOrigin(0);

    this.agreeText = this.add.text(235, 833, "Remember me", {
      fontFamily: "RakeslyRG",
      fontSize: "36px",
      color: "#511a73",
      align: "center",
    });

    this.agreeCheckBox.on("pointerdown", () => {
      this.agreeCheckBoxMark.setVisible(!this.agreeCheckBoxMark.visible);

      if (this.agreeCheckBoxMark.visible) {
        this.option1.setAlpha(1);

        this.option1.setInteractive();
      } else {
        this.option1.setAlpha(0.4);

        this.option1.removeInteractive();
      }
    });

    this.signCheckBox.on("pointerdown", () => {
      this.news = !this.news;

      this.signCheckBoxMark.setVisible(!this.signCheckBoxMark.visible);
    });

    this.rememberCheckBox.on("pointerdown", () => {
      this.remember = !this.remember;

      this.rememberCheckBoxMark.setVisible(!this.rememberCheckBoxMark.visible);
    });

    this.option1 = this.add
      .rexRoundRectangle(400, 975, 520, 100, 50, 0x3e9e79)
      .setDepth(5)
      .setScrollFactor(0)
      .setAlpha(0.4);

    this.option1Text = this.add
      .text(400, 975, "Submit result", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.option2 = this.add
      .rexRoundRectangle(400, 1090, 520, 100, 50, 0x4e316e)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.option2Text = this.add
      .text(400, 1090, "Nope, let's start over", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.option1.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option1, this.option1Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option1, this.option1Text],
            scale: 1,
            duration: 100,

            onComplete: () => {
              if (this.usernameInput.node.value) {
                if (this.validateEmail(this.emailInput.node.value)) {
                  this.socket.emit("score", {
                    username: this.usernameInput.node.value,
                    email: this.emailInput.node.value,
                    score: this.score,
                    remember: this.remember,
                    news: this.news,
                  });
                } else {
                  this.notify(2);
                }
              } else {
                this.notify(1);
              }
            },
          });
        },
      });
    });

    this.option2.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option2, this.option2Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option2, this.option2Text],
            scale: 1,
            duration: 100,

            onComplete: () => {
              this.elements = [
                this.UIBackground,
                this.homeIcon,
                this.scoreBox,
                this.scoreImage,
                this.scoreText,
                this.ballImage,
                this.titleText,
                this.usernameInput,
                this.emailInput,
                this.agreeCheckBox,
                this.agreeCheckBoxMark,
                this.agreeText,
                this.signCheckBox,
                this.signCheckBoxMark,
                this.signText,
                this.rememberCheckBox,
                this.rememberCheckBoxMark,
                this.agreeText,
                this.option1,
                this.option1Text,
                this.option2,
                this.option2Text,
                this.option2,
                this.termsText,
              ];

              this.elements.forEach((element) => {
                element.destroy();
              });

              this.startGame();
            },
          });
        },
      });
    });

    this.termsText = this.add
      .text(
        400,
        1170,
        "Powered by Rabble. By playing this game you accept these Terms & policies.",
        {
          fontFamily: "RakeslyRG",
          fontSize: "20px",
          color: "#000",
          align: "center",
        }
      )
      .setOrigin(0.5);
  }
  addReplayUI() {
    this.background = this.add
      .image(400, 600, "background")
      .setScale(1.4)
      .setScrollFactor(0)
      .setDepth(0);

    this.homeIcon = this.add
      .image(740, 55, "home")
      .setScale(0.5)
      .setInteractive();

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.4,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.5,
            duration: 100,

            onComplete: () => {
              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.scoreTitle = this.add
      .text(
        400,
        170,
        this.score > this.tempHighScore ? "New highscore" : "Your score",
        {
          fontFamily: "RakeslyRG",
          fontSize: "40px",
          color: "#000",
          align: "center",
          stroke: "#000",
          strokeThickness: 1,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.scoreBox = this.add
      .rexRoundRectangle(400, 250, 300, 70, 20, 0x4e316e)
      .setDepth(Infinity)
      .setScrollFactor(0);

    this.scoreImage = this.add
      .image(265, 250, "star")
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setScale(0.9);

    this.scoreText = this.add
      .text(400, 250, this.score, {
        fontFamily: "RakeslyRG",
        fontSize: "40px",
        color: "#fff",
        align: "center",
        stroke: "#fff",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.playButton = this.add
      .image(400, 600, "play")
      .setScale(1.3)
      .setInteractive();

    this.playTitle = this.add
      .text(400, 850, "Play again", {
        fontFamily: "RakeslyRG",
        fontSize: "40px",
        color: "#000",
        align: "center",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.playButton.on("pointerdown", () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 1.1,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.playButton,
            scale: 1.3,
            duration: 100,

            onComplete: () => {
              this.elements = [
                this.background,
                this.homeIcon,
                this.scoreTitle,
                this.scoreBox,
                this.scoreImage,
                this.scoreText,
                this.playButton,
                this.playTitle,
              ];

              this.elements.forEach((element) => {
                element.destroy();
              });

              this.startGame();
            },
          });
        },
      });
    });
  }
  addLeaderboardUI(data) {
    this.background = this.add
      .image(400, 600, "background")
      .setScale(1.4)
      .setScrollFactor(0)
      .setDepth(0);

    if (this.remember) {
      this.userIcon = this.add
        .image(650, 55, "userIcon")
        .setScale(0.5)
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(Infinity);

      this.userIcon.on("pointerdown", () => {
        this.tweens.add({
          targets: this.userIcon,
          scale: 0.4,
          duration: 100,

          onComplete: () => {
            this.tweens.add({
              targets: this.userIcon,
              scale: 0.5,
              duration: 100,

              onComplete: () => {
                this.userIcon.destroy();

                this.notify(4);

                this.username = null;

                this.email = null;

                this.remember = false;

                localStorage.removeItem("axa-bird-game-remember");

                localStorage.removeItem("axa-bird-game-username");

                localStorage.removeItem("axa-bird-game-email");
              },
            });
          },
        });
      });
    }

    this.homeIcon = this.add
      .image(740, 55, "home")
      .setScale(0.4)
      .setInteractive();

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.5,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.leaderboardImage = this.add.image(400, 170, "leaderboardIcon");

    this.leaderboardTitle = this.add
      .text(400, 310, "Leaderboard", {
        fontFamily: "RakeslyRG",
        fontSize: "45px",
        color: "#000",
        align: "center",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.scores = Object.entries(data)
      .map((score) => {
        return score[1];
      })
      .sort((a, b) => b.score - a.score);

    this.players = this.add.dom(400, 375, "div");

    this.players.node.style = `
      	margin: 0px 0px 0px -300px;
      	padding: 0px 20px 0px 0px;
      	width: 600px;
      	height: 770px;
      	display: flex;
      	flex-direction: column;
      	align-items: center;
      	justify-content: center;
      	overflow-y: auto;
      `;

    this.players.node.innerHTML = ``;

    this.scores.forEach((user, index) => {
      this.players.node.innerHTML += `
      		<div class="scoreBox">
      			<div class="scoreImageBox">
      				${
                index < 3
                  ? `<img class="scoreImage" src="assets/positions/${
                      index + 1
                    }.png"/>`
                  : `<div class="scoreText"> ${index + 1}. </div>`
              }
      			</div>

      			<div class="${
              user.username === this.username ? "scoreTitlePlus" : "scoreTitle"
            }">
      				${user.username}
      			</div>

      			<div class="${
              user.username === this.username ? "scoreValuePlus" : "scoreValue"
            }">
      				${user.score}
      			</div>
      		</div>
      	`;
    });
  }
  addCodesUI() {
    this.background = this.add
      .image(400, 600, "background")
      .setScale(1.4)
      .setScrollFactor(0)
      .setDepth(0);

    this.homeIcon = this.add
      .image(740, 55, "home")
      .setScale(0.4)
      .setInteractive();

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.5,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.unlockedImage = this.add.image(400, 170, "unlockedIcon");

    this.unlockedTitle = this.add
      .text(400, 310, "Unlocked codes", {
        fontFamily: "RakeslyRG",
        fontSize: "45px",
        color: "#000",
        align: "center",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.codes.forEach((code, index) => {
      const y = 450 + index * 110;

      const codeBox = this.add
        .rexRoundRectangle(400, y, 520, 100, 20, 0xffffff)
        .setDepth(5)
        .setScrollFactor(0);

      const scoreImage = this.add
        .image(192, y, "star")
        .setDepth(Infinity)
        .setScrollFactor(0)
        .setScale(0.7);

      const scoreText = this.add
        .text(300, y, `${code.points} points`, {
          fontFamily: "RakeslyRG",
          fontSize: "32px",
          color: "#000",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(6);

      const codeText = this.add
        .text(515, y, code.code, {
          fontFamily: "RakeslyRG",
          fontSize: "32px",
          color: "#000",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(6);

      const codeCopy = this.add
        .image(610, y - 3, "copyIcon")
        .setDepth(Infinity)
        .setScrollFactor(0)
        .setScale(0.1)
        .setInteractive();

      codeCopy.on("pointerdown", () => {
        this.tweens.add({
          targets: codeCopy,
          scale: 0.08,
          duration: 100,

          onComplete: () => {
            this.tweens.add({
              targets: codeCopy,
              scale: 0.1,
              duration: 100,

              onComplete: () => {
                navigator.clipboard.writeText(code.code);

                this.notify(5);
              },
            });
          },
        });
      });
    });

    this.rabbleButton = this.add
      .rexRoundRectangle(400, 1060, 420, 100, 50, 0x4e316e)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.rabbleButtonText = this.add
      .text(400, 1060, "Go to Rabble", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.rabbleButton.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.rabbleButton, this.rabbleButtonText],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.rabbleButton, this.rabbleButtonText],
            scale: 1,
            duration: 100,

            onComplete: () => {},
          });
        },
      });
    });
  }
  addUnlockedUI() {
    this.UIBackground = this.add.rectangle(400, 600, 800, 1200, 0xffffff);

    this.homeIcon = this.add
      .image(740, 55, "home")
      .setScale(0.5)
      .setInteractive();

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.4,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.5,
            duration: 100,

            onComplete: () => {
              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.scoreBox = this.add
      .rexRoundRectangle(400, 200, 300, 70, 20, 0x4e316e)
      .setDepth(Infinity)
      .setScrollFactor(0);

    this.scoreImage = this.add
      .image(265, 200, "star")
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setScale(0.9);

    this.scoreText = this.add
      .text(400, 200, this.score, {
        fontFamily: "RakeslyRG",
        fontSize: "40px",
        color: "#fff",
        align: "center",
        stroke: "#fff",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.ballImage = this.add
      .image(400, 110, "ball")
      .setScale(0.3)
      .setDepth(Infinity);

    if (!this.unlocked) {
      this.scene.restart();
    }

    const code = this.unlocked;

    this.titleText = this.add
      .text(
        400,
        340,
        `Congrats! You score over ${code.points} points\nand unlocked a special deal in\nRabble.`,
        {
          fontFamily: "RakeslyRG",
          fontSize: "40px",
          color: "#000",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.productImage = this.add.image(400, 585, "product1").setScale(3);

    this.productBox = this.add
      .rexRoundRectangle(400, 810, 520, 100, 20, 0xebf4f5)
      .setDepth(Infinity)
      .setScrollFactor(0);

    this.codeText = this.add
      .text(235, 810, code.code, {
        fontFamily: "RakeslyRG",
        fontSize: "35px",
        color: "#000",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(Infinity);

    this.codeCopy = this.add
      .image(485, 810, "copyIcon")
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setScale(0.1)
      .setInteractive();

    this.copyCodeText = this.add
      .text(575, 810, "Copy Code", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#bababa",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(Infinity)
      .setInteractive();

    this.codeCopy.on("pointerdown", () => {
      this.tweens.add({
        targets: this.codeCopy,
        scale: 0.08,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.codeCopy,
            scale: 0.1,
            duration: 100,

            onComplete: () => {
              navigator.clipboard.writeText(code.code);

              this.notify(6);
            },
          });
        },
      });
    });

    this.copyCodeText.on("pointerdown", () => {
      this.tweens.add({
        targets: this.codeCopy,
        scale: 0.08,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.codeCopy,
            scale: 0.1,
            duration: 100,

            onComplete: () => {
              navigator.clipboard.writeText(code.code);

              this.notify(6);
            },
          });
        },
      });
    });

    this.option1 = this.add
      .rexRoundRectangle(400, 975, 520, 100, 50, 0x3e9e79)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.option1Text = this.add
      .text(400, 975, "Redeem code on Rabble", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.option2 = this.add
      .rexRoundRectangle(400, 1090, 520, 100, 50, 0x4e316e)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive();

    this.option2Text = this.add
      .text(400, 1090, "Play again", {
        fontFamily: "RakeslyRG",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.option1.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option1, this.option1Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option1, this.option1Text],
            scale: 1,
            duration: 100,

            onComplete: () => {},
          });
        },
      });
    });

    this.option2.on("pointerdown", () => {
      this.tweens.add({
        targets: [this.option2, this.option2Text],
        scale: 0.85,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: [this.option2, this.option2Text],
            scale: 1,
            duration: 100,

            onComplete: () => {
              if (this.remember) {
                this.screen = "replay";
              } else {
                this.screen = "restart";
              }

              this.scene.restart();
            },
          });
        },
      });
    });

    this.termsText = this.add
      .text(
        400,
        1170,
        "Powered by Rabble. By playing this game you accept these Terms & policies.",
        {
          fontFamily: "RakeslyRG",
          fontSize: "20px",
          color: "#000",
          align: "center",
        }
      )
      .setOrigin(0.5);
  }
  addInfoUI() {
    this.UIBackground = this.add.rectangle(400, 600, 800, 1200, 0xffffff);

    this.homeIcon = this.add
      .image(740, 55, "home")
      .setScale(0.4)
      .setInteractive();

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.4,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.5,
            duration: 100,

            onComplete: () => {
              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.infoImage = this.add.image(400, 170, "info").setScale();

    this.infoTitle = this.add
      .text(400, 310, "Information", {
        fontFamily: "RakeslyRG",
        fontSize: "40px",
        color: "#000",
        align: "center",
        stroke: "#000",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.infoText = this.add
      .text(
        400,
        710,
        "Desktop Controls: Use left and right arrow keys\nto control the ball.\n\nMobile Controls: Touch left and right sides of the\nscreen to control the ball.\n\nSpring: Allows you to jump higher.\n\nJetpack: Gives you flying ability for a few seconds.\n\nProducts: Collect them to win extra points\nand rewards.\n\nMonsters: AVOID! You will lost the game if you\ncollide with them.",
        {
          fontFamily: "RakeslyRG",
          fontSize: "35px",
          color: "#000",
          align: "center",
          stroke: "#000",
          strokeThickness: 0,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);
  }
  validateEmail(value) {
    const validRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (value.match(validRegex)) {
      return true;
    } else {
      return false;
    }
  }
  startGame() {
    this.angleSpeed = 0;
    this.hoopY = 0;

    this.setup();
    this.addSounds();
    this.addBackground();
    this.addGameUI();
    this.addScores();
    this.addLife();
    this.createCollectibles();
    this.createPlayer();
    this.addClouds();
    this.createControls();
    this.createTouchControls();
    this.createEmitters();
    this.addHoops();

    for (let i = 0; i < this.randomBetween(1, 4); ++i) {
      const cloud = this.physics.add
        .image(
          this.randomBetween(0, 1200),
          this.randomBetween(50, 600),
          `cloud${this.randomBetween(1, 4)}`
        )
        .setScrollFactor(1, 0)
        .setDepth(1);

      this.clouds1.push(cloud);

      cloud.setGravity(0);

      cloud.setVelocityX(this.randomBetween(120, 150));
    }
  }
  setup() {
    this.playing = true;
    this.leftWall = this.physics.add
      .image(0, 600, null)
      .setSize(1, 1200)
      .setVisible(false)
      .setVelocityX(200);
  }
  addSounds() {
    this.jumpSound = this.sound.add("jump");

    this.trampolineSound = this.sound.add("trampoline");

    this.productSound = this.sound.add("product");

    this.lostSound = this.sound.add("lost");
  }
  addBackground() {
    this.background = this.add
      .image(400, 600, "background")
      .setScale(1.2)
      .setScrollFactor(0)
      .setDepth(0);
  }
  addGameUI() {
    this.homeIcon = this.add
      .image(660, 55, "home")
      .setScale(0.4)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.homeIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.homeIcon,
        scale: 0.3,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.homeIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              this.playing = false;

              this.screen = "home";

              this.scene.restart();
            },
          });
        },
      });
    });

    this.soundIcon = this.add
      .image(740, 55, this.soundOn ? "soundOn" : "soundOff")
      .setScale(0.4)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(Infinity);

    this.soundIcon.on("pointerdown", () => {
      this.tweens.add({
        targets: this.soundIcon,
        scale: 0.3,
        duration: 100,

        onComplete: () => {
          this.tweens.add({
            targets: this.soundIcon,
            scale: 0.4,
            duration: 100,

            onComplete: () => {
              if (this.soundOn) {
                this.sound.stopAll();

                this.soundOn = false;

                this.soundIcon.setTexture("soundOff");
              } else {
                this.soundOn = true;

                this.soundIcon.setTexture("soundOn");
              }
            },
          });
        },
      });
    });
  }
  addScores() {
    this.score = 0;

    this.scoreBox = this.add
      .rexRoundRectangle(60, 32, 140, 45, 15, 0x4e316e)
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setOrigin(0);

    this.scoreImage = this.add
      .image(65, 55, "star")
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setScale(0.6);

    this.scoreText = this.add
      .text(140, 55, this.score, {
        fontFamily: "RakeslyRG",
        fontSize: "28px",
        color: "#fff",
        align: "center",
        stroke: "#fff",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Infinity);
  }
  addLife() {
    this.life = 3;

    this.lifeBox = this.add
      .rexRoundRectangle(340, 33, 140, 45, 15, 0x4e316e)
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setOrigin(0);

    for (let i = 0; i < 3; i++) {
      this.lifeImage = this.add
        .image(300 + 70 + i * 40, 55, "heart")
        .setDepth(Infinity)
        .setScrollFactor(0)
        .setScale(0.8);
    }
    for (let i = 0; i < this.life; i++) {
      this.lifeImage = this.add
        .image(300 + 70 + i * 40, 55, "heart-filled")
        .setDepth(Infinity)
        .setScrollFactor(0)
        .setScale(0.8);
    }
  }
  addClouds() {
    this.clouds1 = [];

    this.clouds2 = [];

    this.generateClouds();

    this.time.addEvent({
      delay: 10000,

      callback: () => {
        this.addClouds();
      },
    });
  }
  addHoops() {
    this.hoopsUp = [];
    this.hoopsDown = [];
    this.hoopsLeft = [];
    this.hoopsRight = [];
    this.hoopCollides = [];
    this.generateHoops();
    let addBacteria = false;
    let random = Math.random() * 10;
    if (random > 7) {
      addBacteria = true;
    }

    if (addBacteria) {
      this.generateBacterias();
    }

    this.time.addEvent({
      delay: (3000 * 200) / this.player.speed,

      callback: () => {
        this.addHoops();
      },
    });
  }
  createCollectibles() {
    this.jetpacks = this.physics.add.group();

    this.trampolines = this.physics.add.group();

    this.enemies = this.physics.add.group();

    this.products = this.physics.add.group();

    const framesArray = [];

    for (let i = 1; i <= 32; ++i) {
      framesArray.push({
        key: `enemy${i}`,
      });
    }

    this.anims.create({
      key: "enemyIdle",
      frames: framesArray,
      frameRate: 15,
      repeat: -1,
    });
  }
  createPlayer() {
    this.player = this.physics.add
      .image(400, 300, "player")
      .setScale(0.4)
      .setDepth(4)
      .setCircle(50);

    this.player.speed = 200;

    this.player.moveDirection = {
      left: false,
      right: false,
    };

    this.player.flying = false;

    this.player.lost = false;

    this.player.ended = false;

    this.player.body.setGravityY(800);

    this.cameras.main.startFollow(this.player);

    this.cameras.main.setBounds(0, 0, 800, 1200, true);
  }
  createControls() {
    this.player.moveDirection.right = true;
    this.input.keyboard.on("keydown", (event) => {
      if (event.key === " " && this.canJump && !this.player.lost) {
        // this.player.moveDirection.right = true;
        this.canJump = true;
        this.player.setVelocityY(-400);
        if (this.soundOn) {
          this.jumpSound.play();
        }
        setTimeout(() => {
          this.canJump = true;
        }, 800);
      } else {
      }
    });

    this.input.keyboard.on("keyup", (event) => {
      if (event.key === " ") {
        this.player.moveDirection.right = false;
      }
    });
  }
  createTouchControls() {
    this.touchLeft = this.add
      .rectangle(200, 600, 400, 1200, 0xffffff)
      .setDepth(5)
      .setScrollFactor(0)
      .setAlpha(0.001)
      .setInteractive();

    this.touchRight = this.add
      .rectangle(600, 600, 400, 1200, 0xffffff)
      .setDepth(5)
      .setScrollFactor(0)
      .setAlpha(0.001)
      .setInteractive();

    this.touchLeft.on("pointerdown", () => {
      this.player.moveDirection.left = true;
    });

    this.touchLeft.on("pointerup", () => {
      this.player.moveDirection.left = false;
    });

    this.touchLeft.on("pointerout", () => {
      this.player.moveDirection.left = false;
    });

    this.touchRight.on("pointerdown", () => {
      this.player.moveDirection.right = true;
    });

    this.touchRight.on("pointerup", () => {
      this.player.moveDirection.right = false;
    });

    this.touchRight.on("pointerout", () => {
      this.player.moveDirection.right = false;
    });
  }
  createEmitters() {
    this.emitter = this.add.particles(0, 0, "emitte", {
      frame: "Match3_Icon_23",
      x: {
        onEmit: (particle, key, t, value) => {
          return this.player.x;
        },
        onUpdate: (particle, key, t, value) => {
          return value;
        },
      },
      y: {
        onEmit: (particle, key, t, value) => {
          return this.player.y;
        },
        onUpdate: (particle, key, t, value) => {
          return value + t * 1;
        },
      },
      scale: { start: 0.12, end: 0.1 },
      // scale: 0.3,
      alpha: { start: 0.8, end: 0 },
      speed: 20,
      // speedX: -500,
      // speedY: 100,
      lifespan: 500,
    });
    this.emitter.setDepth(3);
  }
  generateClouds() {
    for (let i = 0; i < this.randomBetween(1, 4); ++i) {
      const cloud = this.physics.add
        .image(
          this.player.x + 800,
          this.randomBetween(50, 600),
          `cloud${this.randomBetween(1, 4)}`
        )
        .setScrollFactor(1, 0)
        .setDepth(1);
      this.clouds2.push(cloud);
      cloud.setGravity(0);
      cloud.setVelocityX(this.randomBetween(120, 150));
    }
  }
  generateHoops() {
    if (this.score < 100) {
      this.level = 1;
    } else if (this.score < 250) {
      this.level = 2;
    } else if (this.score < 400) {
      this.level = 3;
    } else if (this.score < 600) {
      this.level = 4;
    } else {
      this.level = 5;
    }
    let moving = false;

    let randomAngle = [-15, -10, -5, 0, 5, 10, 15];
    let angle = randomAngle[Math.floor(Math.random() * 6.9)];

    if (this.level == 1) {
      angle = 0;
    } else if (this.level == 2) {
      angle = 0;
    }
    if (this.level >= 2 && angle == 0) {
      moving = true;
    }

    let hoopX = this.player.x + 800;
    let hoopY = this.randomBetween(200, 1000);
    this.hoopY = hoopY;
    this.hoopX = hoopX;

    const hoopLeft = this.physics.add
      .image(
        hoopX - 68 * Math.cos((angle * Math.PI) / 360),
        hoopY - 150 * Math.sin((angle * Math.PI) / 360),
        "hoop1"
      )
      .setScrollFactor(1, 0)
      .setDepth(1)
      .setScale(0.035, 0.1)
      .setAngle(angle)
      .setVisible(false);
    this.hoopsLeft.push(hoopLeft);
    hoopLeft.setGravity(0);
    hoopLeft.setVelocityX(this.player.speed / 4);

    const hoopRight = this.physics.add
      .image(
        hoopX + 68 * Math.cos((angle * Math.PI) / 360),
        hoopY + 150 * Math.sin((angle * Math.PI) / 360),
        "hoop1"
      )
      .setScrollFactor(1, 0)
      .setDepth(1)
      .setScale(0.035, 0.1)
      .setAngle(angle)
      .setVisible(false);
    this.hoopsRight.push(hoopRight);
    hoopRight.setGravity(0);
    hoopRight.setVelocityX(this.player.speed / 4);

    const hoop1 = this.physics.add
      .image(hoopX, hoopY, "hoop1")
      .setScrollFactor(1, 0)
      .setDepth(2)
      .setScale(0.7, 0.8)
      .setAngle(angle);
    this.hoopsUp.push(hoop1);
    hoop1.setGravity(0);
    hoop1.setVelocityX(this.player.speed / 4);
    const hoop2 = this.physics.add
      .image(hoopX, hoopY, "hoop2")
      .setScrollFactor(1, 0)
      .setDepth(4)
      .setScale(0.7, 0.8)
      .setAngle(hoop1.angle);
    this.hoopsDown.push(hoop2);
    hoop2.setGravity(0);
    hoop2.setVelocityX(this.player.speed / 4);

    const hoopCollide = this.physics.add
      .image(hoopX, hoopY, "hoop1")
      .setScrollFactor(1, 0)
      .setDepth(1)
      .setScale(0.35, 0.005)
      .setVisible(false);
    this.hoopCollides.push(hoopCollide);
    hoopCollide.setGravity(0);
    hoopCollide.setVelocityX(this.player.speed / 4);

    this.physics.add.overlap(this.player, hoopCollide, () => {
      if (!this.player.lost) {
        hoopLeft.destroy();
        hoopRight.destroy();
        hoopCollide.destroy();
        this.hoopTween(hoop1);
        this.hoopTween(hoop2);
        this.score += this.pointTimes;
        this.pointTimes += 1;
      }
    });
    this.physics.add.overlap(hoopLeft, this.leftWall, () => {
      if (!this.player.lost) {
        hoopLeft.destroy();
        hoopRight.destroy();
        hoopCollide.destroy();
        hoop1.destroy();
        hoop2.destroy();
        this.life -= 1;
        this.updateLives();
        if (this.life == 0) {
          this.player.lost = true;
        }
      }
    });

    this.physics.add.overlap(this.player, hoopLeft, () => {
      this.pointTimes = 1;
      if (this.soundOn) {
        this.jumpSound.play();
      }
      if (this.player.y - 10 < hoopLeft.y) {
        if (!moving) {
          if (hoopLeft.angle == -15) {
            hoopLeft.x += 24;
            hoopLeft.y += 25;
            hoopRight.x -= 24;
            hoopRight.y -= 25;
          } else if (hoopLeft.angle == -10) {
            hoopLeft.x += 20;
            hoopLeft.y += 27;
            hoopRight.x -= 20;
            hoopRight.y -= 27;
          } else if (hoopLeft.angle == -5) {
            hoopLeft.x += 16;
            hoopLeft.y += 29;
            hoopRight.x -= 16;
            hoopRight.y -= 29;
          } else if (hoopLeft.angle == 0) {
            hoopLeft.x += 11;
            hoopLeft.y += 31;
            hoopRight.x -= 12;
            hoopRight.y -= 31;
          } else if (hoopLeft.angle == 5) {
            hoopLeft.x += 8;
            hoopLeft.y += 34;
            hoopRight.x -= 8;
            hoopRight.y -= 34;
          } else if (hoopLeft.angle == 10) {
            hoopLeft.x += 5;
            hoopLeft.y += 37;
            hoopRight.x -= 5;
            hoopRight.y -= 37;
          } else if (hoopLeft.angle == 15) {
            hoopLeft.y += 40;
            hoopRight.y -= 40;
          }
          this.updateAngle(hoop1, hoopLeft.angle - 30);
          this.updateAngle(hoop2, hoopLeft.angle - 30);
          this.updateAngle(hoopLeft, hoopLeft.angle - 30);
          this.updateAngle(hoopRight, hoopLeft.angle - 30);
          this.updateAngle(hoopCollide, hoopLeft.angle - 30);
        }
        this.player.setVelocityY(-200);
      } else if (this.player.y - 10 > hoopLeft.y) {
        if (!moving) {
          if (hoopLeft.angle == 15) {
            hoopLeft.x += 24;
            hoopLeft.y -= 25;
            hoopRight.x -= 24;
            hoopRight.y += 25;
          } else if (hoopLeft.angle == 10) {
            hoopLeft.x += 20;
            hoopLeft.y -= 27;
            hoopRight.x -= 20;
            hoopRight.y += 27;
          } else if (hoopLeft.angle == 5) {
            hoopLeft.x += 16;
            hoopLeft.y -= 29;
            hoopRight.x -= 16;
            hoopRight.y += 29;
          } else if (hoopLeft.angle == 0) {
            hoopLeft.x += 12;
            hoopLeft.y -= 31;
            hoopRight.x -= 12;
            hoopRight.y += 31;
          } else if (hoopLeft.angle == -5) {
            hoopLeft.x += 8;
            hoopLeft.y -= 34;
            hoopRight.x -= 8;
            hoopRight.y += 34;
          } else if (hoopLeft.angle == -10) {
            hoopLeft.x += 5;
            hoopLeft.y -= 37;
            hoopRight.x -= 5;
            hoopRight.y += 37;
          } else if (hoopLeft.angle == -15) {
            hoopLeft.y -= 40;
            hoopRight.y += 40;
          }
          this.updateAngle(hoop1, hoopLeft.angle + 30);
          this.updateAngle(hoop2, hoopLeft.angle + 30);
          this.updateAngle(hoopLeft, hoopLeft.angle + 30);
          this.updateAngle(hoopRight, hoopLeft.angle + 30);
          this.updateAngle(hoopCollide, hoopLeft.angle + 30);
        }
        this.player.setVelocityY(100);
      }
      this.angleSpeed = Math.random() * 10 - 5;
    });
    this.physics.add.overlap(this.player, hoopRight, () => {
      this.pointTimes = 1;
      if (this.soundOn) {
        this.jumpSound.play();
      }
      if (this.player.y - 10 < hoopRight.y) {
        if (!moving) {
          if (hoopLeft.angle == 15) {
            hoopLeft.x += 24;
            hoopLeft.y -= 25;
            hoopRight.x -= 20;
            hoopRight.y += 25;
          } else if (hoopLeft.angle == 10) {
            hoopLeft.x += 20;
            hoopLeft.y -= 27;
            hoopRight.x -= 16;
            hoopRight.y += 27;
          } else if (hoopLeft.angle == 5) {
            hoopLeft.x += 16;
            hoopLeft.y -= 29;
            hoopRight.x -= 14;
            hoopRight.y += 29;
          } else if (hoopLeft.angle == 0) {
            hoopLeft.x += 12;
            hoopLeft.y -= 31;
            hoopRight.x -= 12;
            hoopRight.y += 31;
          } else if (hoopLeft.angle == -5) {
            hoopLeft.x += 8;
            hoopLeft.y -= 34;
            hoopRight.x -= 8;
            hoopRight.y += 34;
          } else if (hoopLeft.angle == -10) {
            hoopLeft.x += 5;
            hoopLeft.y -= 37;
            hoopRight.x -= 5;
            hoopRight.y += 37;
          } else if (hoopLeft.angle == -15) {
            hoopLeft.y -= 40;
            hoopRight.y += 40;
          }
          this.updateAngle(hoop1, hoopLeft.angle + 30);
          this.updateAngle(hoop2, hoopLeft.angle + 30);
          this.updateAngle(hoopLeft, hoopLeft.angle + 30);
          this.updateAngle(hoopRight, hoopLeft.angle + 30);
          this.updateAngle(hoopCollide, hoopLeft.angle + 30);
        }
        this.player.setVelocityY(-100);
      } else if (this.player.y - 10 > hoopRight.y) {
        if (!moving) {
          if (hoopLeft.angle == -15) {
            hoopLeft.x += 24;
            hoopLeft.y += 25;
            hoopRight.x -= 24;
            hoopRight.y -= 25;
          } else if (hoopLeft.angle == -10) {
            hoopLeft.x += 20;
            hoopLeft.y += 27;
            hoopRight.x -= 18;
            hoopRight.y -= 27;
          } else if (hoopLeft.angle == -5) {
            hoopLeft.x += 16;
            hoopLeft.y += 29;
            hoopRight.x -= 16;
            hoopRight.y -= 29;
          } else if (hoopLeft.angle == 0) {
            hoopLeft.x += 12;
            hoopLeft.y += 31;
            hoopRight.x -= 12;
            hoopRight.y -= 31;
          } else if (hoopLeft.angle == 5) {
            hoopLeft.x += 8;
            hoopLeft.y += 34;
            hoopRight.x -= 8;
            hoopRight.y -= 34;
          } else if (hoopLeft.angle == 10) {
            hoopLeft.x += 5;
            hoopLeft.y += 37;
            hoopRight.x -= 5;
            hoopRight.y -= 37;
          } else if (hoopLeft.angle == 15) {
            hoopLeft.y += 40;
            hoopRight.y -= 40;
          }
          this.updateAngle(hoop1, hoopLeft.angle - 30);
          this.updateAngle(hoop2, hoopLeft.angle - 30);
          this.updateAngle(hoopLeft, hoopLeft.angle - 30);
          this.updateAngle(hoopRight, hoopLeft.angle - 30);
          this.updateAngle(hoopCollide, hoopLeft.angle - 30);
        }
        this.player.setVelocityY(100);
      }
      this.angleSpeed = Math.random() * 10;
    });
    if (
      (this.level == 2 ||
        this.level == 3 ||
        this.level == 4 ||
        this.level == 5) &&
      angle == 0
    ) {
      this.hoopUpDown(hoopLeft, 1);
      this.hoopUpDown(hoopRight, 1);
      this.hoopUpDown(hoop1, 1);
      this.hoopUpDown(hoop2, 1);
      this.hoopUpDown(hoopCollide, 1);
    }
    if (this.level == 4) {
      this.player.speed = 250;
    }
    if (this.level == 5) {
      this.player.speed = 300;
    }
  }
  updateAngle(target, targetAngle) {
    this.tweens.add({
      targets: target,
      angle: targetAngle,
      ease: "Sine.easeInOut",
      duration: 400,
    });
  }
  hoopTween(hoop) {
    this.tweens.add({
      targets: hoop,
      scaleX: 6, // Increase width
      scaleY: 3, // Increase height
      alpha: 0, // Decrease visibility to fully transparent
      duration: 500, // 1 second for the scaling and fade-out effect
      ease: "Power1", // Easing function for smooth transition
      onComplete: () => {
        // Step 2: Destroy the hoop after the animation completes
        hoop.destroy();
      },
    });
  }
  hoopUpDown(hoop, t) {
    // Move the hoop up and down
    this.tweens.add({
      targets: hoop,
      y: 600 * t, // Move 50 pixels up and down
      duration: 3000, // 1 second for up and down
      yoyo: true, // Make the tween reverse back to the original position
      repeat: -1, // Infinite repeat
      ease: "Sine.easeInOut",
    });
  }
  generateBacterias() {
    let bacteriaX = this.hoopX;
    let random = Math.random() * 200;
    let bacteriaY = this.hoopY - 100 + random;
    let selectBacteria = this.randomBetween(1, 5);

    const bacteria = this.physics.add
      .image(bacteriaX, bacteriaY, `bacteria${selectBacteria}`)
      .setScrollFactor(1, 0)
      .setDepth(3)
      .setScale(0.4);
    bacteria.setGravity(0);
    bacteria.setVelocityX(this.player.speed / 4);
    const bacteriaCollider = this.physics.add
      .image(bacteriaX, bacteriaY, "bacteria1")
      .setScrollFactor(1, 0)
      .setDepth(4)
      .setScale(0.4)
      .setVisible(false);
    bacteriaCollider.setGravity(0);
    bacteriaCollider.setVelocityX(this.player.speed / 4);

    this.physics.add.overlap(this.player, bacteriaCollider, () => {
      if (!this.player.lost) {
        if (this.soundOn) {
          this.productSound.play();
        }
        this.score += 10;
        bacteriaCollider.destroy();
        this.bacteriaTween(bacteria);
      }
    });
  }
  bacteriaTween(hoop) {
    this.tweens.add({
      targets: hoop,
      scaleX: 1, // Increase width
      scaleY: 1, // Increase height
      alpha: 0, // Decrease visibility to fully transparent
      duration: 500, // 1 second for the scaling and fade-out effect
      ease: "Power1", // Easing function for smooth transition
      onComplete: () => {
        // Step 2: Destroy the hoop after the animation completes
        hoop.destroy();
      },
    });
  }
  scoreAnimation() {
    const animationText = this.add
      .text(400, 100, "+50", {
        fontFamily: "RakeslyRG",
        fontSize: "100px",
        stroke: "#4e316e",
        strokeThickness: 10,
        color: "#fcba03",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(Infinity);

    this.tweens.add({
      targets: animationText,
      alpha: 1,
      duration: 400,

      onComplete: () => {
        this.time.addEvent({
          delay: 200,

          callback: () => {
            this.tweens.add({
              targets: animationText,
              alpha: 0,
              duration: 400,

              onComplete: () => {
                animationText.destroy();
              },
            });
          },
        });
      },
    });
  }
  notify(code) {
    let message, x, y;

    if (code === 1) {
      message = "Enter your username!";

      x = 200;
      y = 100;
    } else if (code === 2) {
      message = "Invalid email!";

      x = 260;
      y = 100;
    } else if (code === 3) {
      message = "Username already taken!";

      x = 190;
      y = 100;
    } else if (code === 4) {
      message = "User removed sucessfully";

      x = 400;
      y = 40;
    } else if (code === 5) {
      message = "Code copied to clipboard";

      x = 400;
      y = 365;
    } else if (code === 6) {
      message = "Code copied to clipboard";

      x = 400;
      y = 890;
    }

    const notificationText = this.add
      .text(x, y, message, {
        fontFamily: "RakeslyRG",
        fontSize: "35px",
        color: "#f20071",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(Infinity);

    this.tweens.add({
      targets: notificationText,
      alpha: 1,
      duration: 200,

      onComplete: () => {
        this.time.addEvent({
          delay: 1000,

          callback: () => {
            this.tweens.add({
              targets: notificationText,
              alpha: 0,
              duration: 200,

              onComplete: () => {
                notificationText.destroy();
              },
            });
          },
        });
      },
    });
  }
  randomBetween(min, max) {
    return Phaser.Math.Between(min, max);
  }
  update() {
    if (this.playing) {
      this.updateScore();
      this.updatePlayerControls();
      this.updateCameraBounds();
      this.updateObjects();
      this.checkPlayerLost();
    }
  }
  moveEnemies() {
    if (this.enemies) {
      this.enemies.children.each((enemy) => {
        if (enemy.x < 80) {
          enemy.setVelocityX(300);
        } else if (enemy.x > 720) {
          enemy.setVelocityX(-300);
        }
      });
    }
  }
  updatePlayerControls() {
    if (this.player) {
      const bounds = this.player.getBounds();
      this.player.angle += (30 * this.angleSpeed) / 10;
      if (this.angleSpeed > 0) {
        this.angleSpeed -= 0.01;
      } else if (this.angleSpeed < 0) {
        this.angleSpeed += 0.01;
      }

      if (!this.player.lost) {
        if (this.player.moveDirection.right) {
          this.player.flipX = false;

          this.player.setVelocityX(this.player.speed);
          this.leftWall.setVelocityX(this.player.speed);
        }
      }
    }
  }
  updateCameraBounds() {
    if (this.player) {
      if (!this.player.lost) {
        this.cameraBound = this.player.x - 200;
        // this.cameraBound = 100;
        this.cameras.main.setBounds(this.cameraBound, 0, 1200, 0, true);
      }
    }
  }
  checkPlayerLost() {
    if (this.player && !this.player.lost) {
      if (this.player.y > 1200 || this.player.y < 0) {
        this.player.lost = true;
      }
    }

    if (this.player && this.player.lost && !this.player.ended) {
      this.player.ended = true;

      this.sound.stopAll();

      if (this.soundOn) {
        this.lostSound.play();
      }

      this.time.addEvent({
        delay: 1000,

        callback: () => {
          this.cameras.main.fadeOut(500);

          this.time.addEvent({
            delay: 1000,

            callback: () => {
              this.tempHighScore = this.highScore;

              if (this.score > this.highScore) {
                this.highScore = this.score;
              }

              localStorage.setItem("axa-bird-game-highScore", this.highScore);

              localStorage.setItem("axa-bird-game-score", this.score);

              this.playing = false;

              // let unlocked = false;

              // if (this.score >= 500 && this.score < 1000) {
              //   if (this.codes.length < 1) {
              //     unlocked = true;

              //     this.codes.push({
              //       points: "500",
              //       code: "YOURCODE",
              //     });
              //   }
              // }

              // if (this.score >= 1000 && this.score < 5000) {
              //   if (this.codes.length < 2) {
              //     unlocked = true;

              //     this.codes.push({
              //       points: "1000",
              //       code: "YOURCODE",
              //     });
              //   }
              // }

              // if (this.score >= 5000) {
              //   if (this.codes.length < 3) {
              //     unlocked = true;

              //     this.codes.push({
              //       points: "5000",
              //       code: "YOURCODE",
              //     });
              //   }
              // }

              // if (unlocked) {
              //   localStorage.setItem("axa-bird-game-codes", JSON.stringify(this.codes));

              //   this.screen = "unlocked";

              //   this.scene.restart();
              // } else {
              if (this.remember && this.score > 0) {
                this.socket.emit(
                  "scoreUpdate",
                  {
                    username: this.username,
                    email: this.email,
                    score: this.score,
                    news: this.news,
                  },
                  (unlocked) => {
                    if (unlocked) {
                      this.unlocked = unlocked;
                      this.screen = "unlocked";
                    } else {
                      this.screen = "replay";
                    }
                    this.scene.restart();
                  }
                );
              } else {
                this.screen = "restart";
                this.scene.restart();
              }
            },
            //   },
          });
        },
      });
    }
  }

  updateObjects() {
    if (this.player && !this.player.lost) {
      if (this.clouds1 && this.clouds2) {
        this.clouds2.forEach((cloud) => {
          if (cloud.x < this.player.x - 200) {
            this.clouds2.splice(this.clouds1.indexOf(cloud), 1);

            cloud.destroy();
          }
        });
      }

      if (this.platforms) {
        this.platforms.children.each((platform) => {
          if (platform.y > this.player.y + 670) {
            this.platforms.remove(platform);

            platform.destroy();
          }

          if (!platform.passed) {
            if (this.player.y < platform.y) {
              platform.passed = true;
            }
          }
        });
      }

      if (this.jetpacks) {
        this.jetpacks.children.each((jetpack) => {
          if (jetpack.y > this.player.y + 670) {
            this.jetpacks.remove(jetpack);

            jetpack.destroy();
          }
        });
      }

      if (this.trampolines) {
        this.trampolines.children.each((trampoline) => {
          if (trampoline.y > this.player.y + 670) {
            this.trampolines.remove(trampoline);

            trampoline.destroy();
          }
        });
      }

      if (this.enemies) {
        this.enemies.children.each((enemy) => {
          if (enemy.y > this.player.y + 670) {
            if (enemy.sound.isPlaying) {
              this.tweens.add({
                targets: enemy.sound,
                volume: 0,
                duration: 1000,

                onComplete: () => {
                  enemy.sound.stop();
                },
              });
            }

            this.enemies.remove(enemy);

            enemy.destroy();
          }
        });
      }

      if (this.products) {
        this.products.children.each((product) => {
          if (product.y > this.player.y + 670) {
            product.destroy();

            this.products.remove(product);
          }
        });
      }
    }
  }
  updateScore() {
    if (this.scoreText) {
      this.scoreText.setText(this.score);
    }
  }
  updateLives() {
    this.lifeBox = this.add
      .rexRoundRectangle(340, 33, 140, 45, 15, 0x4e316e)
      .setDepth(Infinity)
      .setScrollFactor(0)
      .setOrigin(0);
    for (let i = 0; i < 3; i++) {
      this.lifeImage = this.add
        .image(300 + 150 - i * 40, 55, "heart")
        .setDepth(Infinity)
        .setScrollFactor(0)
        .setScale(0.8);
    }
    for (let i = 0; i < this.life; i++) {
      this.lifeImage = this.add
        .image(300 + 150 - i * 40, 55, "heart-filled")
        .setDepth(Infinity)
        .setScrollFactor(0)
        .setScale(0.8);
    }
  }
}

const game = new Phaser.Game({
  parent: "game",
  type: Phaser.AUTO,
  width: 800,
  height: 1200,
  border: 2,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  input: {
    activePointers: 3,
  },
  scene: [Game],
});

window.oncontextmenu = (event) => {
  event.preventDefault();
};

console.warn = () => {
  return false;
};
