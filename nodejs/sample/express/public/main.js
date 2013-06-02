/* demobo setting */
if (typeof DEMOBO != 'undefined') {
	DEMOBO.maxPlayers = 1;
	DEMOBO.stayOnBlur = true;
	DEMOBO.appName = "www.presentationdocs.com";
	DEMOBO.init = function () {
		demobo.setController({"page": "presentation"});
		demobo.renderQR();
		demobo.addEventListener('input',function(e) {
			var playerIndex = demobo.getPlayerIndex(e.deviceID);
			if (playerIndex>0) return;
			if (e.source=='demoboVolume') {
				if (e.value=="down") {
					prevPage();
				} else if (e.value=="up") {
					nextPage();
				}
			}
		},false);
		demobo.addEventListener('swipe',function(e) {
			var playerIndex = demobo.getPlayerIndex(e.deviceID);
			if (playerIndex>0) return;
			if (e.direction=="left") {
				prevPage();
			} else if (e.direction=="right") {
				nextPage();
			}
		},false);
		demobo.addEventListener('gesture',function(e) {
			if (!$("input[type='checkbox']").attr('checked')) return;
			var playerIndex = demobo.getPlayerIndex(e.deviceID);
			if (playerIndex>0) return;
			if (!e.gestureName) {
				nextPage();
			}
		},false);
		demobo.addEventListener('start',function(e) {
			var playerIndex = demobo.getPlayerIndex(e.deviceID);
			if (playerIndex == -1) {
				addUser(e);
			}
			toggleScreen();
		},false);
		demobo.addEventListener('connected',addUser,false);
		setTimeout(function(){demobo.getDeviceInfo('','addUser');},100);
	};
	demobo.renderBrowserWarning = function(){
	  showMessage('We only support Safari and Chrome browsers on your laptop or desktop at this moment.', 'Sorry', false);    
	  $('.ui-dialog-titlebar-close.ui-corner-all').hide();
	};
	if (screen.width<1200) $('#wrapper').css("zoom", $('body').height()/(100+$('#tab-labels').height()));
}

$(function(){
	setupEvents();
});
function setupEvents() {
	$('#fullscreenMask').click(normalScreen);
	$( "#tabs" ).tabs();
	$('body').bind('dragover', function (e) {
	    e.preventDefault();
	    $('#app-container').css({
	    	'background' : '#69aa35'
	    });
	    return false;
	});
	$('body').bind('dragleave', function (e) {
	    e.preventDefault();
	    $('#app-container').css({
	      'background' : '#ddd'
	    });
	    return false;
	});
	$('body').bind('drop', function (e) {
	    e.preventDefault();
	    if (e.stopPropagation) {
	        e.stopPropagation();
	    }
	    $('#app-container').css({
	    	'background' : '#ddd'
	    });

	    var dndText = e.originalEvent.dataTransfer.getData('Text');
	    if (dndText) processURL(dndText, true);
	    else {
	    	var files = e.dataTransfer.files;
	    	handleDropFiles(files);
	    }
	    clickTab(2);
	    return false;
	});
	$('.btn-group').on('click', '.prevButton', function(){
		prevPage();
	});
	$('.btn-group').on('click', '.nextButton', function(){
		nextPage();
	});
	$('#saveButton').on('click', function(){
		saveSpeakernotes();
	});
	$('#speakernotearea').bind('input propertychange', function() {
	      speakernotes.notes[curPage-1]=$(this).val();
	});
}

var appData = {};
var flashMovie;
var curPage = 0;
var totalPage = 0;
var scribd_doc;
var curPresentationId;
var dragElement = null;
var speakernotes = {};

//Makes sure the dataTransfer information is sent when we
//Drop the item in the drop box.
$.event.props.push('dataTransfer');
var z = -40;
//The number of images to display
var maxFiles = 1;
var errMessage = 0;
//Get all of the data URIs and put them in an array
var dataArray = [];

function loadSpeakernotes(id) {
	speakernotes = {"id": id, notes: ["note 1","note2"], sequence: [], audio: ""};
	console.log(speakernotes);
}
function saveSpeakernotes() {
	console.log(speakernotes);
}
function loadDoc(doc) {
	var docstr = doc.split('~');
	var type = docstr[0];
	var id = docstr[1];
	if (id.indexOf('/')==-1) {
		if (type=='pdf' || type=='ppt' || type=='doc') {
			loadGviewByURL(id);
		}
	}else {
		processURL(id);
	}
}
function hideAll() {
	$('.docFrame').hide();
}

function clickTab(index){
	$('.selected').removeClass('selected');
	$('#tab-label'+index).addClass('selected');
	$('#mid-container div[id^="tabs-"]').hide();
	$('#tabs-'+index).slideDown('3000');
	$('#pageCover').trigger('click');
}

function loadGviewByURL(id) {
	loadSpeakernotes(id);
	curPresentationId = id;
	pdfURL = "http://docs.google.com/gview?url="+encodeURIComponent(id)+"&a=bi";
	curPage = 1;
	loadGviewImg(1);
	hideAll();
	$('#pdfviewer').show();
	$('#pdfviewer').scrollTop(0);
}
function loadGviewImg(page) {
	if (page==1) $('#pdfviewer').html('');
	var img = $('<img src="'+pdfURL+"&pagenumber="+page+'">');
	$('#pdfviewer').append(img);
	img.height($('#pdfviewer').height());
	img.load(function(e){ loadGviewImg(page+1); });
	img.error(function(e){ 
		$(this).remove(); 
		totalPage=page-1; 
		setPage();
	});
}
function toggleScreen() {
	var curFrame = $('.docFrame:visible');
	curFrame.toggleClass('fullscreen');
	$('#fullscreenMask').hide();
	if (curFrame.attr('id')=='pdfviewer') {
		$('#pdfviewer').scrollTop($('#pdfviewer').scrollTop()*$('#pdfviewer').height()/$('#pdfviewer img').height());
		$('#pdfviewer img').height($('#pdfviewer').height());
	} 
	if (curFrame.hasClass('fullscreen')) {
		$('#fullscreenMask').show();
	}
};
function normalScreen() {
	$('#fullscreenMask').hide();
	var curFrame = $('.docFrame:visible');
	curFrame.removeClass('fullscreen');
	if (curFrame.attr('id')=='pdfviewer') {
		$('#pdfviewer').scrollTop($('#pdfviewer').scrollTop()*$('#pdfviewer').height()/$('#pdfviewer img').height());
		$('#pdfviewer img').height($('#pdfviewer').height());
	}
}
function setPage() {
	$("#pageNumber pre").text(curPage+"/"+totalPage);
	$("#speakernotearea").val("");
	if (curPage) $("#speakernotearea").val(speakernotes.notes[curPage-1]);
}
function nextPage() {
	if (curPage>=totalPage) return;
	if ($('#pdfviewer').is(":visible")) {
		curPage ++;
		$('#pdfviewer').animate({
            scrollTop: '+='+$('#pdfviewer').height()
        }, 'slow');
        setPage();
	}
}
function prevPage() {
	if (curPage<=1) return;
	if ($('#pdfviewer').is(":visible")) {
		curPage --;
		if (curPage<=0) {
			curPage = 1;
			setPage();
			return;
		}
		$('#pdfviewer').animate({
            scrollTop: '-='+$('#pdfviewer').height()
        }, 'slow');
        setPage();
	}
}
function addUser(e) {
	demobo.addPlayer(e.deviceID);
	loadAppData();
	clickTab(2);
	$('#qrimage').effect("bounce",{ }, 100);
	if ($( "#dialog" ).hasClass('ui-dialog-content')) $( "#dialog" ).dialog("close");
}
function saveAppData(data) {
	if (data) appData = data;
	demobo.setData(demobo.getPlayers()[0], appData);
}
function loadAppData() {
	renderRecent();
	demobo.getData(demobo.getPlayers()[0], "setAppData");
}
function setAppData(data) {
	appData = data;
	renderRecent();
}
function saveDoc(docType, docID) {
	if (demobo.getPlayers().length==0) return;
	var docLink = docType + '~' + docID;
	if (!appData.docs) appData.docs = [];
	if (appData.docs.indexOf(docLink)==-1) {
		appData.docs.push(docLink);
		saveAppData();
		renderRecent();
	}
}
function renderRecent() {
	$('.popoverHint').popover("hide");
	$("#recentDocs").show();
	$('#panelTitle').text('Recent Files');
	$("#recentDocs").html('');
	for (var i in appData.docs) {
		var doc = appData.docs[i].split('~');
		var type = doc[0];
		var id = doc[1];
		var title = id.split('/').reverse();
		if (type=='googleDocs') title = title[1];
		else title = title[0];
		var newDoc  = $('<div class="item"><div class="link doc" title="'+title+'"><div class="icon '+type+'"></div>' + title + '</div><div class="link remove">x</div></div>');
		$("#recentDocs").append(newDoc);
	}
	var recentFilesCount = appData.docs?appData.docs.length:0;
	$("#tab-label2 .label").text(recentFilesCount);
	if (recentFilesCount==2) {
		showPopoverLove(recentFilesCount);
	}
	$("#recentDocs div.doc").click(function(){
		var index = $("#recentDocs div.doc").index(this);
		loadDoc(appData.docs[index]);
	});
	$("#recentDocs div.remove").click(function(){
		var index = $("#recentDocs div.remove").index(this);
		appData.docs.splice(index, 1);
		saveAppData(appData);
		renderRecent();
	}); 
}
function processURL(url ,save) {
	if (url.indexOf('.pdf')!=-1) {
    	var docType = 'pdf';
    	if (save) saveDoc(docType,url);
    	loadGviewByURL(url);
    } else if (url.indexOf('.ppt')!=-1 && url.indexOf('.pptx')==-1) {
    	var docType = 'ppt';
    	if (save) saveDoc(docType,url);
    	loadGviewByURL(url);
    } else if (url.indexOf('http')==0) {
    	showMessage('We only support slideshare.net, google presentation docs, scribd.com, pdf, ppt and doc files at this moment.'
    			+'<br><br><div class="appLink" href="http://www.slideshare.net/upload" target="_blank">Here</div> is how to upload pdf and ppt to slideshare.net.'
    			+'<br><br><div class="appLink" href="https://support.google.com/drive/bin/answer.py?hl=en&answer=186466" target="_blank">Here</div> is how to convert pdf and ppt into Google Presentation.'
    			+'<br><br><div class="appLink" href="http://support.google.com/drive/bin/answer.py?hl=en&answer=176692" target="_blank">Here</div> is the limitation of Google Drive on PDF conversion into Presentation: the maximum size for pdf file is 2MB.'
    			, 'Document url not supported.');
    }
}

function showMessage(text, title, qr) {
	$('.popoverHint').popover("hide");
	$( "#dialogBody" ).html(text);
	var dialogLeft = $('#mid-container').offset().left+9;
	$( "#dialog" ).dialog({
		dialogClass:'dialog_style1',
		title: title,
		position: [dialogLeft,0],
		width: $('body').width()-dialogLeft,
		height: $('body').height(),
		modal: true,
		draggable: false,
		hide: {effect: 'slide', duration: 1000, direction: "right"},
		show: {effect: 'drop', duration: 1000, direction: "right"}
	});
	if (qr) $('#qrcode').show();
	else $('#qrcode').hide();
	$('#disqus_thread').hide();
	$('.ui-dialog-titlebar-close.ui-corner-all').attr('href',null);
}

function showInfoPDF() {
	showMessage("Drag & drop the file into this app<br><br>Beta Version only supports files less than 500KB.<br>Please upload big files to <div class=\"appLink\" href=\"http://www.slideshare.net/upload\" target=\"_blank\">slideshare.net</div> or <div class=\"appLink\" href=\"https://drive.google.com\" target=\"_blank\">drive.google.com</div>", 'Supported files: PDF, PPT and DOC');
}

function showQR() {
	if (demobo.getState()==1) {
		showMessage('If this is the first time you pair your phone with this browser, click "Create Connection" and scan the following QR code with the phone app. <br><br>Otherwise just click the browser icon on the phone app to connect.',
				'Connect With Phone', true);
	} else {
		showMessage('Unable to connect to the server. If you have a firewall, it may be blocking the connection on port 8000. Reload the website to retry.',
				'Failed to connect', false);		
	}
}

function showSpeakerNotes() {
}
function handleDropFiles(files) {
	// For each file
    $.each(files, function(index, file) {
    	if (index>0) return;
		// Some error messaging
		if (!files[index].type.match('application/pdf')
		        && !files[index].type.match('application/vnd.openxmlformats-officedocument.presentationml.presentation')
		        && !files[index].type.match('application/vnd.ms-powerpoint')
		        && !files[index].type.match('application/msword')
		        && !files[index].type.match('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
				showMessage('We only support PDF, PPT, XLS and DOC files', 'Document format not supported.');
		        return false;
		}
		// Start a new instance of FileReader
        var fileReader = new FileReader();
        // When the filereader loads initiate a function
        fileReader.onload = (function(file) {
                return function(e) {
                        // Push the data URI into an array
                        // dataArray.push({name : file.name, value : this.result, guid : DEMOBO.roomID});
                        dataArray = [{name : file.name, value : this.result, guid : DEMOBO.roomID}];
                        if (localStorage.getItem(file.name) == file.size) {
                        	var docURL = 'http://net.demobo.com/dnd/docs/'+DEMOBO.roomID+'/'+file.name;
                    		processURL(docURL);
                        } else {
                        	uploadFile(file);
                        }
                };
        })(files[index]);
        // For data URI purposes
        fileReader.readAsDataURL(file);
    });
}
function restartFiles() {
    dataArray.length = 0;
    return false;
}
function uploadFile(file) {
    var totalPercent = 100 / dataArray.length;
    var x = 0;
    var y = 0;
    $.each(dataArray, function(index, fileData) {
    		if (file.size>500000) {
    			showMessage('Beta Version only supports files less than 500KB. Please upload files to <div class="appLink" href="http://www.slideshare.net/upload" target="_blank">slideshare.net</div> or <div class="appLink" href="https://drive.google.com" target="_blank">drive.google.com</div>'
    					+'<br><br><div class="appLink" href="http://www.slideshare.net/upload" target="_blank">Here</div> is how to upload pdf and ppt to slideshare.net.'
    	    			+'<br><br><div class="appLink" href="https://support.google.com/drive/bin/answer.py?hl=en&answer=186466" target="_blank">Here</div> is how to convert pdf and ppt into Google Presentation.'
    	    			+'<br><br><div class="appLink" href="http://support.google.com/drive/bin/answer.py?hl=en&answer=176692" target="_blank">Here</div> is the limitation of Google Drive on PDF conversion into Presentation: the maximum size for pdf file is 2MB.'
    	    			, 'Document too large.');
    			return;
    		}
            $.post('http://net.demobo.com/dnd/upload.php', dataArray[index], function(data) {
                    var fileName = dataArray[index].name;
                    ++x;
                    if(totalPercent*(x) == 100) {
                            // Show the upload is complete
                            // Reset everything when the loading is completed
                            setTimeout(restartFiles, 500);

                    }// else if(totalPercent*(x) < 100) {
                            // Show that the files are uploading
                   // }
                    // Show a message showing the file URL.
                    var dataSplit = data.split(':');
                    if(dataSplit[1] == 'uploaded successfully') {
                		var docURL = 'http://net.demobo.com/dnd/docs/'+dataSplit[0];
                		processURL(docURL,true);
                		localStorage.setItem(file.name, file.size);
                    } else {
                    	showMessage('Upload failed', '');
                    }

            });
    });
    return false;
}
