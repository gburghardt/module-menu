Module.MenuModule = Module.Base.extend({

prototype: {

	KEYCODE_ESCAPE: 27,

	options: {
		data: null,
		disabledItemClass: "disabled",
		itemRootSelector: "ol",
		method: "GET",
		view: null,
		url: null
	},

	destructor: function(keepElement) {
		if (this.document) {
			this.document.removeEventListener("click", this.handleDocumentClick, false);
		}

		Module.Base.prototype.destructor.call(this, keepElement);
	},

	_ready: function() {
		Module.Base.prototype._ready.call(this);

		if (this.options.view && !this.options.data && !this.options.url) {
			throw new Error("Missing required options 'data' or 'url' in order the render view '" + this.options.view + "'");
		}
		else if (!this.options.view && this.options.data) {
			throw new Error("Missing required option: view");
		}

		this.element.setAttribute("data-actions", this.controllerId + ".handleAction");
		this.listen("menu.loaded", this, this.handleMenuLoaded);

		this.handleDocumentClick = this.handleDocumentClick.bind(this);
		this.document.addEventListener("click", this.handleDocumentClick, false);

		this._loadMenu();
	},

	cancel: function click(event, element, params) {
		event.stop();
	},

	closeMenu: function(event, element, params) {
		console.info(event.type, event);
	},

	chooseItem: function click(event, element, params) {
		event.stop();

		if (element.classList.contains(this.options.disabledItemClass)) {
			return;
		}
		else if (!params.event) {
			throw new Error("Missing required param: 'event' (name of the event to publish)");
		}

		if (!params.confirm || this.window.confirm(params.confirm)) {
			this.publish(params.event, params.data);
		}

		if (!params.keepMenu) {
			this.destructor();
		}
	},

	handleDocumentClick: function(event) {
		this.destructor();
	},

	handleMenuLoaded: function(publisher, data) {
		this._loaded();
	},

	_loadMenu: function() {
		if (this.options.url) {
			this._loadMenuFromServer();
		}
		else if (this.options.data) {
			this._loadMenuFromDocument();
		}
	},

	_loadMenuFromDocument: function() {
		this.render(this.options.view, this.options.data, this.element)
			.context(this)
			.done(function() {
				this._loaded();
			});
	},

	_loadMenuFromServer: function() {
		var xhr = new XMLHttpRequest(),
		    self = this;

		var cleanup = function() {
			self = xhr = xhr.onreadystatechange = null;
		};

		var onreadystatechange = function() {
			if (this.readyState !== 4) {
				return;
			}
			else if (this.status >= 200 && this.status <= 299) {
				var contentType = this.getResponseHeader("content-type"),
				    itemRoot = self.element,
				    data, result;

				if ((/text\/(html|plain)/i).test(contentType)) {
					itemRoot.innerHTML = this.responseText;
					self._loaded();
				}
				else if ((/text\/json/i).test(contentType)) {
					data = JSON.parse(this.responseText);

					self.render(self.options.view, data, itemRoot)
						.done(function() {
							self._loaded();
						});

					data = null;
				}

				cleanup();
			}
			else {
				cleanup();

				throw new Error("Request to load items from server failed with status: " + this.status + " (" + self.options.method + " " + self.options.url + ")");
			}
		};

		xhr.onreadystatechange = onreadystatechange;
		xhr.open(this.options.method.toUpperCase(), this.options.url);
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(null);
	},

	onControllerRegistered: function(frontController, controllerId) {
	},

	onControllerUnregistered: function(frontController, controllerId) {
	}

}

});