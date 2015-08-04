
/**
 * @author stefan eugster
 */

var WAKTOOLS = WAKTOOLS || {};


/**
 * match
 */
 
WAKTOOLS.match = function(regex, string) {
 	// extract amount
	if ( string && string.match(regex) && string.match(regex).length > 1) {
		return string.match(regex)[1]
	} else {
		return '';
	}
};


/**
 * convert nl into space
 */

WAKTOOLS.nl2space = function( str ) {
    var str = str || '';
    // replace line breaks with br tags
    str = str.replace(/\n/g, ', ');
    return str;
};


/**
 * convert nl into <br />
 */

WAKTOOLS.nl2br = function( str ) {
    var str = str || '';
    // replace line breaks with br tags
    str = str.replace(/\n/g, '<br />');
    return str;
};


/**
 * delay throttle
 */

WAKTOOLS.delay = (function(){
  var timer = 0;
  return function(callback, ms) {
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();


/**
 * destroy all existing CKEditors
 */
 
WAKTOOLS.destroyAllEditors = function() {
	// remove existing editors
	if (window.CKEDITOR && window.CKEDITOR.instances) {
    	for (var i in window.CKEDITOR.instances) {
    	    window.CKEDITOR.instances[i].destroy(false);
    	}
    }
}


/**
 * screen handler
 *
 * @param path {String} component path ex. '/components/public-page.waComponent'
 */

WAKTOOLS.screen = function(path) {
    // activate navigation item
	$('.mainNavItem').each(function(event) {
	    if ($(this).attr('data-component') == path) {
	        $(this).addClass('activeItem');
	    } else {
	        $(this).removeClass('activeItem');
	    }
	});
    // cache current component path
    localStorage.setItem('componentPath', path);
	// remove existing editors
	WAKTOOLS.destroyAllEditors();
	// show spinner
	WAKTOOLS.Spinner.show();
    // fade out
	$('#mainScreen').animate({opacity: 0}, 300, 'easeInOutQuart', function() {
        // load component
    	$$('mainScreen').loadComponent({
    		path: path,
    		onSuccess: function(event){
    		    // fade in
    		    $('#mainScreen').animate({opacity: 1}, 1200, 'easeInOutQuart', function() {
    		        // hide spinner
    		        WAKTOOLS.Spinner.hide();
    		    });
    		}
    	});
	});
};


/**
 * add navigation to header bar
 */

WAKTOOLS.navigation = function (callbackFn) {
	// add component to catalog
	ds.addToCatalog('Component', {
		onSuccess: function(event){
			// load navigation
		    ds.Component.getNavigation({
				onSuccess: function (event) {
		        	var $container = $('#navContainer'),
		        		templateSource = $('#navigationTemplate').html(),
		        		templateFn = Handlebars.compile(templateSource),
		        		data = event.result;

		            // apply template
		        	$container.html(templateFn(data));
		        	// callback function
		            callbackFn();
		        	// navigation cklick event
		        	$container.on('click', '.mainNavItem', function(event) {
		        		var $this = $(this),
		        		    linkName = $this.text();

		        		WAKTOOLS.screen($this.attr('data-component'));
		        	});
		        	// navigation mouseenter event
		        	$container.on('mouseenter', '.mainNavItem', function(event) {
		        		$(this).addClass('hoverItem');
		        	});
		        	// navigation mouseleave event
		        	$container.on('mouseleave', '.mainNavItem', function(event) {
		        		$(this).removeClass('hoverItem');
		        	});			    
				}
			}); 		
		}
	});  
};


/**
 * user login handler
 *
 * @param defaultComponentPath {String} default component path ex. '/components/public-message.waComponent'
 */

WAKTOOLS.login = function(defaultComponentPath) {
    var componentPath = localStorage.getItem('componentPath') ? localStorage.getItem('componentPath') : defaultComponentPath;
    
    // validate if user is logged in
	if (WAF.directory.currentUser() === null) {
        // show login wrapper
        $$('wrapperLogin').show()    	
	} else {
	    // hide login layer
	    $('#wrapperLogin').fadeOut({opacity: 0, duration: 300, easing: 'easeInOutQuart'});
	    // add navigation
	    WAKTOOLS.navigation(function(event) {
            // add login name to header bar
    		$('#loginName').text(WAF.directory.currentUser().fullName);
    	    // set default page if component path is not set
    	    if (componentPath) {
                // load component
                WAKTOOLS.screen(componentPath);    	
    	    }	    
	    });
		// idle timer (logout after 45 min inactivity)
		new WAKTOOLS.Idle(1000 * 60 * 45, WAKTOOLS.logout);
	}
};


/**
 * user logout handler
 */

WAKTOOLS.logout = function() {
	WAF.directory.logout({
		onSuccess: function() {
		    // reset component path
		    localStorage.setItem('componentPath', '');
		    // reload window
		    window.location.reload();
		}
	});
};


/**
 * user notifications
 *
 * @param message {Object}        message object
 * @param options {Object}        options object (message type)
 * @return        {Object/String} result 
 */

WAKTOOLS.alert = function(message, options) {
	try {
	    var options = options || {};
	    
	    // default type
	    options.type = options.type || 'success';
		// display message for debugging issues
		console.log(message);	    
	    // toastr default settings
		toastr.options = {
			closeButton: false,
			timeOut: '5000',
  			extendedTimeOut: '1000',
  			positionClass: 'toast-bottom-right'
		};
		// check if message is string
		if (Object.prototype.toString.call(message) === '[object String]' || Object.prototype.toString.call(message) === '[object Boolean]') {
		    // display message
			toastr[options.type]('' + message);

			return message;	
		} else if (Object.prototype.toString.call(message) === '[object Array]') {
		    // loop array
		    for (var i = 0; i < message.length; i++) {
		        if (message[i].errCode == 100) {
			        return WAKTOOLS.alert(message[i], options);
			    }
    		};
		} else {
		    // validate if object
		    if (Object.prototype.toString.call(message) === '[object Object]') {
    			if ('result' in message) {
    				return WAKTOOLS.alert(message.result, options);
    			} else if ('message' in message) {
    				return WAKTOOLS.alert(message.message, options);
    			} else if ('successMessage' in message) {
    			    if (options.onSuccess) {
    			        options.onSuccess();
    			        options.onSuccess = null;
    			    }
    				return WAKTOOLS.alert(message.successMessage, options);
    			} else if ('errorMessage' in message) {
    			    options.type = 'error';
    			    if (options.onError) {
    			        options.onError();
    			        options.onError = null;
    			    }
    				return WAKTOOLS.alert(message.errorMessage, options);
    			} else if ('error' in message) {
    			    options.type = 'error';
    			    if (options.onError) {
    			        options.onError();
    			        options.onError = null;
    			    }
    				return WAKTOOLS.alert(message.error, options);
    			} else {
    				throw new Error('Unknown message object');
    			}
		    }
		}
	} catch (e) {
		toastr.error('Es ist ein Fehler aufgetreten. Bitte schliessen sie die Anwendung und versuchen Sie es erneut.');
		console.log(e);
	}
};


/**
 * modal component dialog
 *
 * @param options {Object} options opject
 */

WAKTOOLS.modal = function(options) {
	try {
		var options = options || {},
			width = options.width || 452,
			height = options.height || 250,
			componentPath = options.componentPath || '/components/modal-confirm.waComponent',
			dialog,
			dialogComponent;

		// dialog size
		switch(options.size) {
			case 'medium':
				width = 1024;
				height = 720;
				break;
			case 'full':
				width = window.innerWidth - 80;
				height = window.innerHeight - 80;
				break;
		}
		// component title
		waf.widgets.txtTitle.setValue(options.title);
		// get dialog
		dialog = waf.widgets.modalDialog;
		// set dialog size and position
		dialog.setWidth(width);
		dialog.setHeight(height);
		dialog.setLeft((window.innerWidth - width)/2);
		dialog.setBottom((window.innerHeight - height)/2);
		dialog.displayDialog();
		// get dialog component
		dialogComponent = waf.widgets.modalDialogComponent;
		// remove old web component
		dialogComponent.removeComponent();
		// load new web component
		dialogComponent.loadComponent({
			path: componentPath,
			userData: { 
				onConfirm: options.onConfirm,
				onCancel: options.onCancel,
				isModal: true,
				message: options.message,
				value: options.value,
				selectedElementID: options.selectedElementID
			}
		});	
	} catch (e) {
		console.log(e);
	}	
}


/**
 * tooltip
 *
 * @param selector {String} jQuery selector
 */

WAKTOOLS.tooltip = function(selector) {
	try {
	    var offsetX = 20,
	        offsetY = 10,
	        timeout;
        
        // add on mouse enter
        $('body').on('mouseenter', selector, function(e) {
            var title = $(this).text();

            timeout = setTimeout(function(){
                $('<div class="tooltip"></div>').text(title).appendTo('body').css({top: e.pageY + offsetY, left: e.pageX + offsetX}).fadeIn('slow');
            }, 400);
        });
        // remove on mouseleave
         $('body').on('mouseleave', selector, function() {
            clearTimeout(timeout);
            $('.tooltip').remove();
        });
        // set position on mouse move
        $('body').on('mousemove', selector, function(e) {
            $('.tooltip').css({top: e.pageY + offsetY, left: e.pageX + offsetX});
        });
        // remove on click
        $('body').on('click', selector, function() {
            clearTimeout(timeout);
            $('.tooltip').remove();
        });
	} catch (e) {
		console.log(e);
	}	
}


/**
 * spinner (font awesome animated spinner icon)
 * http://fortawesome.github.io/Font-Awesome/examples/#animated
 */

WAKTOOLS.Spinner = WAKTOOLS.Spinner || {};

WAKTOOLS.Spinner.show = function () {
    // validate if spinner object exists
    if ($('div.awesome-spinner').length === 0) {
        // add spinner object
        $('<div class="awesome-spinner"><i class="fa fa-refresh fa-spin"></i></div>').appendTo('body');
    }
};

WAKTOOLS.Spinner.hide = function () {
    // hide spinner
    $('div.awesome-spinner').remove();	
};


/**
 * idle timer
 *
 * @param  {Number}   time in milliseconds
 * @param  {Function} timeout functions
 */

WAKTOOLS.Idle = function(time, timeoutFn) {
	var _this = this;
		
	// idle time
	_this.idleTime = time;
	// timeout function
	_this.timeoutFn = timeoutFn;
	// add event listeners
    window.addEventListener("mousemove", function(){_this.reset()}, false);
    window.addEventListener("mousedown", function(){_this.reset()}, false);
    window.addEventListener("keypress", function(){_this.reset()}, false);
};

WAKTOOLS.Idle.prototype.startTimer = function() {
	var _this = this;
	
    // set timout function
    _this.timeoutID = window.setTimeout(function(){
    	_this.timeoutFn();
    }, _this.idleTime);
};

WAKTOOLS.Idle.prototype.reset = function() {
	var _this = this;

	// reset timout
    window.clearTimeout(_this.timeoutID);
    // restart timer
    _this.startTimer();		
};