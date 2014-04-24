describe("Module.MenuModule", function() {

	function MockEvent(type, target) {
		this.type = type;
		this.target = target;
	}
	MockEvent.prototype.stop = function() {};
	MockEvent.prototype.preventDefault = function() {};
	MockEvent.prototype.target = null;
	MockEvent.prototype.type = null;

	describe("init", function() {

		var module, element, renderPromise;

		beforeEach(function() {
			MockingBird.XMLHttpRequest.disableNetworkConnections();
			element = document.createElement("div");
			element.innerHTML = '<ol></ol>';
			module = new Module.MenuModule();
			module.setElement(element);
			renderPromise = {
				context: function() { return this; },
				done: function() {}
			};
		});

		afterEach(function() {
			MockingBird.XMLHttpRequest.enableNetworkConnections();
		});

		it("fills menu items from an AJAX request returning HTML", function() {
			MockingBird.XMLHttpRequest.mock("/menu_items", "GET", {
				responseHeaders: {
					"content-type": "text/html"
				},
				body: [
					'<ol>',
						'<li>Item 1</li>',
						'<li>Item 2</li>',
					'</ol>'
				].join("")
			});

			module.setOptions({
				url: "/menu_items"
			});

			module.init();
			expect(module.element.firstChild.getElementsByTagName("li").length).toBe(2);
		});

		it("generates menu items from an AJAX request returning JSON and rendering a template", function() {
			var data = [
				{ text: "Item 1" },
				{ text: "Item 2" }
			];

			MockingBird.XMLHttpRequest.mock("/menu_items", "GET", {
				responseHeaders: {
					"content-type": "text/json"
				},
				body: data
			});

			module.setOptions({
				view: "/menus/items",
				url: "/menu_items"
			});

			spyOn(module, "render").and.returnValue(renderPromise);

			module.init();

			expect(module.render).toHaveBeenCalledWith("/menus/items", data, element);
		});

		it("fills menu items from a client side template", function() {
			var data = [
				{ text: "Item 1" },
				{ text: "Item 2" }
			];

			module.setOptions({
				view: "/menus/items",
				data: data
			});

			spyOn(module, "render").and.returnValue(renderPromise);

			module.init();

			expect(module.render).toHaveBeenCalledWith("/menus/items", data, element);
		});

		it("assumes the root element has all menu items", function() {
			element.innerHTML = '<ol><li>Item 1</li><li>Item 2</li></ol>';

			var list = element.firstChild,
			    firstItem = list.firstChild,
			    lastItem = list.lastChild;

			module.init();
			expect(element.firstChild).toBe(list);
			expect(list.firstChild).toBe(firstItem);
			expect(list.lastChild).toBe(lastItem);
		});

		it("throws an error if no 'url' was provided in the options", function() {
			module.setOptions({
				view: "foo"
			});

			expect(function() {
				module.init();
			}).toThrowError("Missing required options 'data' or 'url' in order the render view 'foo'");
		});

		it("throws an error if no 'view' was provided in the options when 'data' exists", function() {
			module.setOptions({
				data: {}
			});

			expect(function() {
				module.init();
			}).toThrowError("Missing required option: view");
		});

	});

	describe("chooseItem", function() {

		var module, element, list, item, event, win;

		beforeEach(function() {
			win = {
				confirm: function() {}
			};

			item = document.createElement("li");
			item.innerHTML = 'Item 1';

			list = document.createElement("ol");
			list.appendChild(item);

			element = document.createElement("div");
			element.appendChild(list);

			module = new Module.MenuModule();
			spyOn(module, "publish");
			module.setElement(element);
			module.window = win;
			module.init();

			event = new MockEvent("click", item);
		});

		it("publishes an event with data", function() {
			var params = {
				event: "test",
				data: {}
			};

			module.chooseItem(event, item, params);

			expect(module.publish).toHaveBeenCalledWith("test", params.data);
		});

		it("asks the user to confirm their choice", function() {
			var params = {
				confirm: "Are you sure?",
				event: "test",
				data: {}
			};

			spyOn(win, "confirm").and.returnValue(true);

			module.chooseItem(event, item, params);

			expect(win.confirm).toHaveBeenCalledWith(params.confirm);
			expect(module.publish).toHaveBeenCalledWith("test", params.data);
		});

		it("does nothing if the menu item is disabled", function() {
			var params = { event: "test" };

			item.classList.add(module.options.disabledItemClass);

			module.chooseItem(event, item, params);

			expect(module.publish).not.toHaveBeenCalled();
		});

		it("throws an error if the 'event' param is missing", function() {
			expect(function() {
				module.chooseItem(event, item, {});
			}).toThrowError("Missing required param: 'event' (name of the event to publish)");
		});

	});

});
