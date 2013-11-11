"use strict";

/**
 * Singleton for the editor page
 */
var helloEditor = {
	editor: null,
	popcorn: null,
	processingInstance: null,
	videoMode: true,
	runCache: [],
	lessonIndex: 1,
	/**
	 * Initialize Ace editor and UI elements
	 */
	init: function () {

		// Configure Editor
		
  		this.editor = ace.edit("editor");
  		this.editor.getSession().setMode("ace/mode/processing");
  		this.editor.setTheme("ace/theme/processing");
  		//this.editor.renderer.setShowGutter(false); 
  		this.editor.setShowFoldWidgets(false);
  		this.editor.setHighlightActiveLine(false);
  		this.editor.renderer.setShowPrintMargin(false);

  		// Configure UI

  		this.setupUI();

  		// Load proper lesson
  		
  		var lessonIndex = 1;
  		var lessonTime = null;
  		var hash = top.location.hash.replace('#', '');;

  		if (hash.length > 0) {
  			var lessonName = hash.split("-")[0];
  			
  			var lessonTable {
  				"hello":1,
  				"shapes":2,
  				"color":3,
  				"interact":4,
  				"decisions":5,
  				"goodbye":6,
  			};

  			if (lessonTable[lessonName] != null)
  				lessonIndex = lessonTable[lessonName];

  			if (hash.split("-")[1] != undefined) lessonTime = hash.split("-")[1];
  			
  		}

  		this.loadLesson(lessonIndex, lessonTime);

  		// Resize callback

    	$( window ).resize(function() {
    		helloEditor.resizeUI();
		});	    

		// Color Picker

		$('#colorPicker').spectrum({
			flat: true,
    		showInput: false,
    		//showInitial: true
		}); 

		$("#colorPicker").spectrum("container").hide();

		$(".sp-cancel").click(function(){		
			$("#colorPicker").spectrum("container").hide();
		});

		$(".sp-choose").click(function(){
			var color = $("#colorPicker").spectrum("get").toRgb();

			var range = $("#colorPicker").spectrum.range;
			var token = $("#colorPicker").spectrum.token;

			helloEditor.editor.session.replace(range,token.value + "("+color.r+","+color.g+","+color.b+");");

			$("#colorPicker").spectrum("container").hide();
			helloEditor.editor.focus();
		});

	},
	/**
	 * Initialize UI elements
	 */
	setupUI: function() {

		$("#videoContainer").hover(function(e) {
			$("#videoCommandsContainer").fadeIn();
		},function(e) {
			$("#videoCommandsContainer").fadeOut();
		} );

		$("#modalResetCode").click(function(e) {
			helloEditor.editor.setValue(helloEditor.runCache[helloEditor.lessonIndex], -1);
			$('#errorModal').modal('hide');
		});

		$("#restartButton").click(function(e) {
			$("#hint").hide();
      		helloEditor.popcorn.play(0);
    	});

		// $("#resetButton").click(function(e) {
  //     		helloEditor.editor.setValue(helloEditor.runCache[helloEditor.lessonIndex], -1);
  //   	}).tooltip({container: 'body'});  	

		$("#pauseButton").click(function(e) {
			if (helloEditor.popcorn.paused()) {
      			helloEditor.popcorn.play();
      			$("#pauseButton").html("Pause");
      		} else {
      			helloEditor.popcorn.pause();
      			$("#pauseButton").html("Play");
      		}
    	});

  		$("#nextButton").click(function() {
      		helloEditor.lessonIndex++;
      		helloEditor.loadLesson(helloEditor.lessonIndex, null);
    	}); 

		$("#runButton").click(function(e) {
      		helloEditor.runCode();
      		helloEditor.editor.focus();
    	}).tooltip({container: 'body'});;

  		$("#shareButton").click(function() {
      		helloEditor.createGist();
    	}).tooltip({container: 'body'});;  

 		$("#modalGoogleButton").click(function() {

 			var shareURL = "https://plus.google.com/share";
 			var displayURL = $("#shareModal").attr('data-url');
 			
 			var googleURL = shareURL
				+ "?url=" + displayURL;

			console.log(googleURL);
      		window.open(googleURL);

    	}); 

 		$("#modalFacebookButton").click(function() {

 			var shareURL = "http://www.facebook.com/sharer/sharer.php";
 			var displayURL = $("#shareModal").attr('data-url');
 			var shareTitle = "Hello, Processing";
 			var shareSummary = "Check out my first program!"

			var facebookURL = shareURL
				+ "?s=100"
				+ "&p[url]=" + displayURL
				+ "&p[images][0]="
				+ "&p[title]=" + encodeURIComponent(shareTitle)
				+ "&p[summary]=" + encodeURIComponent(shareSummary);

			console.log(facebookURL);
      		window.open(facebookURL);

    	});  

  		$("#modalTwitterButton").click(function() {
  			var intentURL = "https://twitter.com/intent/tweet"
      		var displayURL = $("#shareModal").attr('data-url');
      		var shareText = "Check out my first program!";
      		var shareVia = "ProcessingOrg";
      		var shareHashtags = "hourofcode";

      		var tweetURL = intentURL
      			+ "?url=" + encodeURIComponent(displayURL)
      			+ "&text=" + encodeURIComponent(shareText)
      			+ "&via=" + shareVia
      			+ "&hashtags=" + shareHashtags;

      		console.log(tweetURL);
      		window.open(tweetURL);

    	});  

    	$("#toggleRulers").click(function() {
    		$("#horizontalRuler").toggle({
    			effect: 'slide',
            	direction: 'down',
        	});
    		$("#verticalRuler").toggle({
    			effect: 'slide',
            	direction: 'right',
        	});
    	}).tooltip({placement:'bottom'});

    	$(".lessonButton").each( function (index, value) {

    		$(value).click( function() {
    			
    			var lessonIndex = parseInt($(this).attr("data-index"));
    			helloEditor.loadLesson(lessonIndex, null);
    			helloEditor.lessonIndex = lessonIndex;

    		});

    	});

    	// Color Picker

    	$(helloEditor.editor).on("click", function(e) {

    		$("#colorPicker").spectrum("container").hide();

    		var editor = helloEditor.editor;
    		var position = editor.getCursorPosition();
    		var token = editor.session.getTokenAt(position.row, position.column);

			 if ( token && /\bcolor\b/.test(token.type)) {

    			var line = editor.session.getLine(position.row);			
				var range = new Range(position.row,0,position.row,line.length);			

				var pixelPosition = editor.renderer.$cursorLayer.getPixelPosition(position, true);

				$("#colorPicker").spectrum.token = token;
				$("#colorPicker").spectrum.range = range;

				$("#colorPicker").spectrum("container").show();;
				$("#colorPicker").spectrum("container").css( {
					position: "absolute",
					top: pixelPosition.top,
					left: pixelPosition.left
				});

			 }

    	});

    	this.resizeUI();

	},
	/**
	 * Try to keep a sane layout at any browser size.
	 * @return {[type]}
	 */
	resizeUI: function() {

		var viewportWidth = ($(window).width() > 800) ? $(window).width() : 800;
		var viewportHeight = $(window).height() - 48;

		$("#interface")
			.height(viewportHeight)
			.width(viewportWidth)
			.css({top: 48, left: 0, marginLeft: 0, marginTop: 0});

		if (this.videoMode) {

			//console.log("Video Mode");

			var videoWidth = viewportWidth * .80;
			var videoHeight = videoWidth / 16 * 9;

			$("#videoContainer")
				.css({
					width: videoWidth,
					height: videoHeight,
					left: "50%",
					top: "50%",
					marginTop: videoHeight/-2,
					marginLeft: videoWidth/-2
				});

			$("#editorContainer").hide();
			$("#canvasContainer").hide();
			$("#videoContainer").show();

		} else {

			//console.log("Editor Mode");

			var videoWidth = viewportWidth - viewportHeight;
			var videoHeight = videoWidth / 16 * 9;

			$("#videoContainer")
				.css({
					width: videoWidth,
					height: videoHeight,
					left: 8,
					top: 8,
					marginTop: 0,
					marginLeft: 0
				});

			$("#editorContainer")
				.css({
					width:videoWidth,
					height: viewportHeight - videoHeight - 32,
					top: videoHeight + 20,
					left: 8
				});

			$("#canvasContainer")
				.height(viewportHeight)
				.width(viewportHeight)
				.css({
					top: 0,
					left: videoWidth
				});		
				
		}	
	},
	/**
	 * Reset the Processing.js instance
	 */
	resetInstance: function() {
		if (this.processingInstance) {
			this.processingInstance.exit();
			this.processingInstance.background("#cfcfcf");
			this.processingInstance = null;
		}
	},
	/**
	 * Loads a lesson into the editor by index
	 */
	loadCode: function(url) {
		this.resetInstance();

		$.get(url, function(data) {
			helloEditor.editor.setValue(data, -1);
		})
	},
	/**
	 * Load the indicated lesson
	 */
	loadLesson: function(index, time) {

    	$(".lessonButton").removeClass("active");
    	$("a[data-index='"+index+"']").addClass("active");

		$("#video").html("");
		helloEditor.videoMode = true;
		helloEditor.resizeUI(); 		

		scripts[index-1].init(time);

	},
	/**
	 * Run current code in Ace
	 */
	runCode: function() {
		this.resetInstance();

		try {
			var processingSource = this.editor.getValue();
			var processingCanvas = document.getElementById("editorCanvas");  

			if (!(/size(\s*\d+\s*,\s*\d+\s*)/.test(processingSource))) {
				processingSource = "size(500,400);\n\n" + processingSource;
			}

			this.processingInstance = new Processing(processingCanvas, processingSource);

			if (typeof this.processingInstance.draw === 'function')
				this.processingInstance.draw();

			// Store successful code in cache

			helloEditor.runCache[helloEditor.lessonIndex] = this.editor.getValue();

			// Resize Canvas Container
			
			$("#editorCanvasBox").css({
				width: this.processingInstance.width,
				height: this.processingInstance.height,
				marginTop: this.processingInstance.height / -2,
				marginLeft: this.processingInstance.width / -2,
			});

			$("#horizontalRuler").css({width: this.processingInstance.width});
			$("#verticalRuler").css({height: this.processingInstance.height});

		}
		catch(e) {
			helloEditor.displayError(e);		
		}

	},
	/**
	 * Show the error modal and try to parse the error into something helpful.
	 */
	displayError: function (e) {

		// This table is an array of pairs consisting of a regular
		// expression and a friendly replacement string which can
		// include values matched in the regex. Pair one example:
		//
		// Input Javascript Error:
		// Can't find variable: rectt
		// Output Friendly Error: 
		// I'm not sure what 'rect' means. Maybe it's a typo?

		var errorTable = [
			[
				/Can't find variable: (\w+)/,
				"I'm not sure what '$1' means. Maybe it's a typo?"
			],
			[
				/(Une|E)xpected token '(\)|\()'/,
				"Looks like your parentheses don't match up. Remember, you need a right parenthesis for every left parenthesis."
			]		
		];

		var outputMessage = e.message;

		for (var i = 0; i < errorTable.length; i++) {
			var regex = errorTable[i][0];
			var string = errorTable[i][1];

			if (regex.test(outputMessage)) {
				outputMessage = outputMessage.replace(regex,string);
				break;
			}
		}

		$('#errorModalText').html(outputMessage);
		$('#errorModal').modal('show');	

	},
	/**
	 * Creates a new Gist with editor contents and shows share modal
	 */
	createGist: function() {

		var processingSource = this.editor.getValue();

		var postData = {
			"description": "Save for Processing Hour of Code",
			"public": true,
			"files": {
				"demo.pde": {
					"content": processingSource
				}
			}
		}

		var postURL = "https://api.github.com/gists";

		$.post(postURL, JSON.stringify(postData))
			.done(function( data ) {
				var gistID = data.id;
				var displayURL = "http://" + $(location).attr('hostname') + ( ($(location).attr('port') != "") ?  ":" + $(location).attr('port') : "" ) + "/display/#" + gistID;

				$('#shareModal').attr('data-url', displayURL);

				$('#shareModalLink').html($("<a/>").attr('href',displayURL).html(displayURL));
				$('#shareModal').modal('show');
			});

	},
	showRulers: function() {
		$("#horizontalRuler").show({
			effect: 'slide',
			direction: 'down',
			duration: "fast"
		});
		$("#verticalRuler").show({
			effect: 'slide',
			direction: 'right',
			duration: "fast"
		});
	},
	hideRulers: function() {

		$("#horizontalRuler").hide({
			effect: 'slide',
			direction: 'down',
			duration: "fast"
		});
		$("#verticalRuler").hide({
			effect: 'slide',
			direction: 'right',
			duration: "fast"
		});

	}
}
