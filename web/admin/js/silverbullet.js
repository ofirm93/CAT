/* 
 *******************************************************************************
 * Copyright 2011-2017 DANTE Ltd. and GÉANT on behalf of the GN3, GN3+, GN4-1 
 * and GN4-2 consortia
 *
 * License: see the web/copyright.php file in the file structure
 *******************************************************************************
 */

/**
 * Silverbullet pages library
 * @author Zilvinas Vaira
 */

/**
 * Silverbullet namespace
 * @namespace
 */

var silverbullet = {};

/**
 * Instantiates all views for Silverbullet application
 * 
 * @constructor Main Silverbullet application
 */
silverbullet.SilverbulletApplication = function (){
    /**
     * DatePicker []
     */
    this.datePickers = [];
    
};
/**
 * 
 * @param {SilverBullet.Views.DatePicker} datePicker
 */
silverbullet.SilverbulletApplication.prototype.addDatePicker = function (datePicker){
    this.datePickers [this.datePickers.length] = datePicker;
};

/**
 * 
 */
silverbullet.SilverbulletApplication.prototype.resetDates = function (){
    for ( var i = 0; i < this.datePickers.length;  i++) {
        this.datePickers[i].addDefaultValue();
    }
};

/**
 * 
 */
silverbullet.SilverbulletApplication.prototype.start = function(){
    
    //Create and render Calendar drop down element
    var calendarPool = new silverbullet.views.CalendarPool();
    calendarPool.render();
    
    //Create and render DatePicker elements
    var datePickerElements = document.getElementsByClassName(silverbullet.views.DatePicker.ELEMENT_CLASS);
    for ( var i = 0; i < datePickerElements.length; i++) {
        var datePicker = new silverbullet.views.DatePicker(datePickerElements[i], calendarPool);
        datePicker.render();
        this.addDatePicker(datePicker);
    }
    
    //Create and render Popup message if any
    var popupMessageElement = document.getElementById(silverbullet.views.PopupMessage.ELEMENT_CLASS);
    if(popupMessageElement){
        var popupMessage = new silverbullet.views.PopupMessage(popupMessageElement);
        popupMessage.render();
    }
    
    //Create all copy to clipboard elements
    var composeEmailPopupElement = document.getElementById(silverbullet.views.ComposeEmailPanel.ELEMENT_CLASS);
    if(composeEmailPopupElement){
        var composeEmailPopup = new silverbullet.views.PopupMessage(composeEmailPopupElement, false);
        var composeEmailPanel = new silverbullet.views.ComposeEmailPanel(composeEmailPopup);
        composeEmailPanel.render();
        var clipboardElements = document.getElementsByClassName(silverbullet.views.TokenProvider.ELEMENT_CLASS);
        for (var i = 0; i < clipboardElements.length; i++) {
            var clipboardElement = new silverbullet.views.TokenProvider(clipboardElements[i], composeEmailPanel);
            clipboardElement.render();
        }
    }
};

/**
 * Silverbullet Views namespace
 * @namespace
 */
silverbullet.views = {};


/**
 * Provides rendering and initialization interfaces
 * 
 * @constructor Defines abstract Silverbullet view class
 * @param {Node} element
 */
silverbullet.views.ViewElement = function(element){
    /**
     * @param {HTMLElement} element
     */
    this.element = element;
};
/**
 * 
 */
silverbullet.views.ViewElement.prototype.render = function (){};

/**
 * Wraps text input element with date picker features
 * 
 * @constructor Date picker input element
 * @param {HTMLElement} element Text input element
 * @param {silverbullet.views.CalendarPool} calendarPool
 */
silverbullet.views.DatePicker = function(element, calendarPool){
    silverbullet.views.ViewElement.call(this, element);
    this.calendarPool = calendarPool;
    this.calendarPanel = calendarPool.getSelectedPanel(element.value, this);
    
    this.element.style.color = 'grey';
    
    this.originalValue = element.value;
    this.originalBackgroundColor = element.style.backgroundColor;
    
    this.validationDate = new Date();
    
    this.errorElement = document.createElement('div');
    this.errorElement.style.position = 'absolute';
    this.errorElement.style.zIndex = '5';
    this.errorElement.style.backgroundColor = 'white';
    this.errorElement.style.border = '1px solid grey';
    this.errorElement.style.display = 'block';
    this.errorTextElement = document.createElement('p');
    this.errorTextElement.style.margin = '5px';
    this.errorTextElement.style.color = 'red';
    this.errorTextElement.style.fontWeight = 'bold';
    
    this.errorElement.appendChild(this.errorTextElement);
    
    this.state = false;
    this.errorState = false;
    
    this.button = this.element.parentNode.getElementsByTagName('button')[0];
};
silverbullet.views.DatePicker.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.DatePicker.prototype.constructor = silverbullet.views.DatePicker;
silverbullet.views.DatePicker.ELEMENT_CLASS = 'sb-date-picker';

/**
 * 
 * @param {String} dateToken
 */
silverbullet.views.DatePicker.prototype.validateDate = function(dateToken){
    if(this.calendarPool.parseDate(this.validationDate, dateToken)){
        if(!this.state){
            this.state = true;
            this.element.style.backgroundColor = this.originalBackgroundColor;
            if(this.errorState){
                this.element.parentNode.removeChild(this.errorElement);
                this.errorState = false;
            }
        }
    }else{
        this.state = false;
        this.element.style.backgroundColor = 'pink';
        this.errorTextElement.innerHTML = "Must be a date!";
        this.element.parentNode.appendChild(this.errorElement);
        this.errorState = true;
    }
};

/**
 * 
 */
silverbullet.views.DatePicker.prototype.removeDefaultValue = function(){
    if(this.element.value == this.originalValue){
        this.element.value = '';
        this.element.style.color = 'black';
    }
};

/**
 * 
 */
silverbullet.views.DatePicker.prototype.addDefaultValue = function(){
    this.element.value = this.originalValue;
    this.element.style.color = 'grey';
};

/**
 * 
 * @returns {Boolean}
 */
silverbullet.views.DatePicker.prototype.isValid = function(){
    return this.state;
};

/**
 * 
 * @param {String} dateValue
 */
silverbullet.views.DatePicker.prototype.setDateValue = function(dateValue){
    this.element.value = dateValue;
};

/**
 * 
 */
silverbullet.views.DatePicker.prototype.togglePopup = function(){
    if(this.element.parentNode.contains(this.calendarPanel.element)){
        this.hidePopup();
    }else{
        this.showPopup();
    }
};

silverbullet.views.DatePicker.prototype.showPopup = function(){
    this.calendarPanel = this.calendarPool.getSelectedPanel(this.element.value, this);
    this.calendarPool.setCalendarPanel(this.calendarPanel);
    this.element.parentNode.appendChild(this.calendarPool.element);
};

silverbullet.views.DatePicker.prototype.hidePopup = function(){
    //if(this.element.parentNode.contains(this.calendarPanel.element)){
        this.element.parentNode.removeChild(this.calendarPool.element);
    //}
};

silverbullet.views.DatePicker.prototype.loadCurrentPanel = function(){
    var calendarPanel = this.calendarPool.getSelectedPanel('now', this);
    this.calendarPool.setCalendarPanel(calendarPanel);
};

silverbullet.views.DatePicker.prototype.loadPreviousPanel = function(){
    var calendarPanel = this.calendarPool.getPreviousPanel(this.calendarPool.calendarPanel);
    this.calendarPool.setCalendarPanel(calendarPanel);
};

silverbullet.views.DatePicker.prototype.loadNextPanel = function(){
    var calendarPanel = this.calendarPool.getNextPanel(this.calendarPool.calendarPanel);
    this.calendarPool.setCalendarPanel(calendarPanel);
};

/**
 * 
 */
silverbullet.views.DatePicker.prototype.render = function(){
    var that = this;
    this.element.addEventListener('focus', function() {
        that.removeDefaultValue();
    });
    this.element.addEventListener('blur', function() {
        if(that.element.value == that.originalValue || that.element.value == ''){
            that.addDefaultValue();
        }
        that.validateDate(that.element.value);
    });
    this.button.addEventListener('click', function() {
        that.togglePopup();
    });
    this.button.addEventListener('blur', function() {
        if(that.calendarPool.isMouseOut()){
            that.hidePopup();
        }
    });

};

/**
 * Provides a panel for date picker object with month and date controls
 * 
 * @constructor Popup calendar panel for Date picker
 * @param {Number} year
 * @param {Number} month
 * @param {silverbullet.views.DatePicker} datePicker
 */
silverbullet.views.CalendarPanel = function(year, month, datePicker){
    silverbullet.views.ViewElement.call(this, document.createElement('div'));
    this.datePicker = datePicker;
    this.year = year;
    this.month = month;
    this.dates = [];
    this.mouseOverState = false;
    
};
silverbullet.views.CalendarPanel.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.CalendarPanel.prototype.constructor = silverbullet.views.CalendarPanel;

/**
 * 
 * @param {Number} month
 * @param {Number} date
 * @param {silverbullet.views.CalendarDate}
 */
silverbullet.views.CalendarPanel.prototype.addCalendarDate = function (month, date, calendarDate) {
    if(typeof this.dates[month] == 'undefined'){
        this.dates[month] = [];
    }
    this.dates[month][date] = calendarDate;
    this.element.appendChild(calendarDate.element);
};

/**
 * 
 */
silverbullet.views.CalendarPanel.prototype.getCalendarDate = function (month, date) {
    if (typeof this.dates[month] != 'undefined' && typeof this.dates[month][date] != 'undefined') {
        return this.dates[month][date];
    }else{
        return null;
    }
};

/**
 * 
 */
silverbullet.views.CalendarPanel.prototype.selectCalendarDate = function(dateValue){
    this.datePicker.setDateValue(dateValue);
    this.datePicker.hidePopup();
    this.datePicker.validateDate(dateValue);
    this.datePicker.calendarPool.mouseOverState = false;
};

/**
 * 
 */
silverbullet.views.CalendarPanel.prototype.setDatePicker = function(datePicker){
    this.datePicker = datePicker;
};

/**
 * 
 * @param {silverbullet.views.DatePicker} datePicker
 */
silverbullet.views.CalendarPanel.prototype.update = function (datePicker, sYear, sMonth, sDate, cYear, cMonth, cDate) {
    this.datePicker = datePicker;

    datePicker.calendarPool.setSelected(sYear, sMonth, sDate);
    datePicker.calendarPool.setCurrent(cYear, cMonth, cDate);

};

/**
 * 
 * @returns {Boolean}
 */
silverbullet.views.CalendarPanel.prototype.isMouseOut = function(){
    return !this.mouseOverState;
};

/**
 * 
 */
silverbullet.views.CalendarPanel.prototype.render = function(){
    var that = this;
    this.element.addEventListener('mouseover', function() {
        that.mouseOverState = true;
    });
    this.element.addEventListener('mouseout', function() {
        that.mouseOverState = false;
    });

};

/**
 * Provides single date element for calendar panel
 * 
 * @constructor Creates and references single date element
 * @param {Date} date
 * @param {silverbullet.views.CalendarPanel} calendarPanel
 */
silverbullet.views.CalendarDate = function (date, calendarPanel) {
    silverbullet.views.ViewElement.call(this, document.createElement('div'));
    this.dateValue = this.toFormatedDateString(date);
    this.calendarPanel = calendarPanel;
    this.originalColor = this.element.style.backgroundColor;
    
    this.element.style.display = 'inline-table';
    this.element.style.cursor = 'pointer';
    this.element.style.textAlign = 'center';
    this.element.style.width = '30px';
    this.element.style.borderBottom = '1px solid grey';
    this.element.innerHTML = date.getDate();
};
silverbullet.views.CalendarDate.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.CalendarDate.prototype.constructor = silverbullet.views.CalendarDate;

/**
 * 
 */
silverbullet.views.CalendarDate.prototype.toFormatedDateString = function (date) {
    var mm = date.getMonth() + 1;
    var dd = date.getDate();
    return date.getFullYear() + '-' + ((mm>9 ? '' : '0') + mm) + '-' + ((dd>9 ? '' : '0') + dd);
};

/**
 * 
 * @param {Date} currentDate
 */
silverbullet.views.CalendarDate.prototype.markCurrent = function () {
    this.element.style.fontWeight = 'bold';
};

/**
 * 
 */
silverbullet.views.CalendarDate.prototype.markSelected = function () {
    this.element.style.backgroundColor = '#BCD7E8';
};

/**
 * 
 */
silverbullet.views.CalendarDate.prototype.restoreCurrent = function () {
    this.element.style.fontWeight = 'normal';
};

/**
 * 
 */
silverbullet.views.CalendarDate.prototype.restoreSelected = function () {
    this.element.style.backgroundColor = 'white';
};

/**
 * 
 */
silverbullet.views.CalendarDate.prototype.render = function () {
    var that = this;
    this.element.addEventListener('mouseover', function () {
        that.originalColor = this.style.backgroundColor;
        this.style.backgroundColor = 'lightgrey';
    });
    this.element.addEventListener('mouseout', function () {
        this.style.backgroundColor = that.originalColor;
    });
    
    this.element.addEventListener('click', function () {
        this.style.backgroundColor = that.originalColor;
        that.calendarPanel.selectCalendarDate(that.dateValue);
    });

}

/**
 * Pool object that stores unique Calendar panels
 * 
 * @constructor 
 */
silverbullet.views.CalendarPool = function(){
    silverbullet.views.ViewElement.call(this, document.createElement('div'));
    this.element.style.position = 'absolute';
    this.element.style.zIndex = '10';
    //this.element.style.width = '300px';
    //this.element.style.height = '200px';
    this.element.style.backgroundColor = 'white';
    this.element.style.border = '1px solid grey';
    this.element.style.display = 'block';
    this.element.style.padding = '10px';
    this.element.setAttribute('tabindex', 0);
    
    this.controlsTitle;
    
    this.calendarPanel;

    this.mouseOverState = false;

    this.cYear;
    this.cMonth;
    this.cDate;
    this.sYear;
    this.sMonth;
    this.sDate;
    
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.calendarPanels = [];
    this.weekDays = ["Sun", "Mon", "Tue","Wed", "Thu","Fri","Sat"];
}
silverbullet.views.CalendarPool.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.CalendarPool.prototype.constructor = silverbullet.views.CalendarPool;

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.setCalendarPanel = function (calendarPanel) {
    this.year = calendarPanel.year;
    this.month = calendarPanel.month;
    if(typeof this.calendarPanel != 'undefined'){
        this.element.removeChild(this.calendarPanel.element);
    }
    this.calendarPanel = calendarPanel;
    this.controlsTitle.innerHTML = calendarPanel.year + ', ' + (calendarPanel.month + 1);
    this.element.appendChild(calendarPanel.element);
};

/**
 * 
 * @returns {Boolean}
 */
silverbullet.views.CalendarPool.prototype.isMouseOut = function(){
    return !this.mouseOverState;
};

/**
 * 
 * @param {Number} year
 * @param {Numebr} month
 * @param {silverbullet.views.CalendarPanel} calendarPanel
 */
silverbullet.views.CalendarPool.prototype.buildCalendarDays = function (year, month, calendarPanel) {
    
    //Find first day in a panel
    this.selectedDate.setFullYear(year);
    this.selectedDate.setMonth(month);
    this.selectedDate.setDate(1);
    var day = this.selectedDate.getDay();
    if(day > 0){
        this.selectedDate.setDate(0);
        var lastDay = this.selectedDate.getDate();
        this.selectedDate.setDate(lastDay - day + 1);
    }

    //Build week days row
    for(var i = 0; i < 7; i++){
        var dayElement = document.createElement('div');
        dayElement.style.display = 'inline-table';
        dayElement.style.textAlign = 'center';
        dayElement.style.width = '30px';
        dayElement.style.backgroundColor = '#F0F0F0';
        dayElement.style.borderBottom = '1px solid grey';
        dayElement.innerHTML = this.weekDays[i];
        calendarPanel.element.appendChild(dayElement);
    }
    calendarPanel.element.appendChild(document.createElement('br'));
    
    //Build all day rows
    var startMonth = this.selectedDate.getMonth();
    while(startMonth != (month + 1) % 12){
        for(var j = 0; j < 7; j++){
            var calendarDate = new silverbullet.views.CalendarDate(this.selectedDate, calendarPanel);
                calendarDate.render();
                calendarPanel.addCalendarDate(this.selectedDate.getMonth(), this.selectedDate.getDate(), calendarDate);
            this.selectedDate.setDate(this.selectedDate.getDate() + 1);
        }
        calendarPanel.element.appendChild(document.createElement('br'));
        startMonth = this.selectedDate.getMonth();
    }
};

/**
 * 
 * @param {Number} year
 * @param {Number} month
 * @param {silverbullet.views.CalendarPanel}
 */
silverbullet.views.CalendarPool.prototype.addCalendarPanel = function (year, month, calendarPanel) {
    if(typeof this.calendarPanels[year] == 'undefined'){
        this.calendarPanels[year] = [];
    }
    this.calendarPanels[year][month] = calendarPanel;
};

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.getCalendarPanel = function (year, month, datePicker) {
    var calendarPanel;
    if (typeof this.calendarPanels[year] == 'undefined' || typeof this.calendarPanels[year][month] == 'undefined') {
        calendarPanel = new silverbullet.views.CalendarPanel(year, month, datePicker);
            //this.buildCalendarControls(year + ', ' + (month + 1), calendarPanel);
            this.buildCalendarDays(year, month, calendarPanel);
        calendarPanel.render();
        this.addCalendarPanel(year, month, calendarPanel);
    }else{
        calendarPanel = this.calendarPanels[year][month];
    }
    return calendarPanel;
};

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.setSelected = function(year, month, date){
    var calendarPanel;
    var calendarDate;
    if(year != this.sYear || month != this.sMonth || date != this.sDate){
        if(typeof this.sYear != 'undefined'){
            calendarPanel = this.getCalendarPanel(this.sYear, this.sMonth, this);
            calendarDate = calendarPanel.getCalendarDate(this.sMonth, this.sDate);
            calendarDate.restoreSelected();
        }
        calendarPanel = this.getCalendarPanel(year, month, this);
        calendarDate = calendarPanel.getCalendarDate(month, date);
        if(calendarDate != null){
            calendarDate.markSelected();
            this.sYear = year;
            this.sMonth = month;
            this.sDate = date;
        }
    }

};

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.setCurrent = function(year, month, date){
    var calendarPanel;
    var calendarDate;
    if(year != this.cYear || month != this.cMonth || date != this.cDate){
        if(typeof this.cYear != 'undefined'){
            calendarPanel = this.getCalendarPanel(this.cYear, this.cMonth, this);
            calendarDate = calendarPanel.getCalendarDate(this.cMonth, this.cDate);
            calendarDate.restoreCurrent();
        }
        calendarPanel = this.getCalendarPanel(year, month, this);
        calendarDate = calendarPanel.getCalendarDate(month, date);
        if(calendarDate != null){
            calendarDate.markCurrent();
            this.cYear = year;
            this.cMonth = month;
            this.cDate = date;
        }
    }

};

silverbullet.views.CalendarPool.prototype.parseDate = function (dateObject, dateToken) {
    var dateArray = dateToken.split('-');
    dateObject.setFullYear(parseInt(dateArray[0]));
    var month = parseInt(dateArray[1])-1;
    dateObject.setMonth((month >= 0 && month < 12) ? month : NaN);
    var date = parseInt(dateArray[2]);
    dateObject.setDate((date >= 0 && date < 32) ? date : NaN);
    return !isNaN(dateObject.getDate()) && date == dateObject.getDate();
};

/**
 * 
 * @param {String} selectedDateToken
 * @param {silverbullet.views.DatePicker} datePicker
 */
silverbullet.views.CalendarPool.prototype.getSelectedPanel = function (selectedDateToken, datePicker) {
    
    //Parse current date 
    if(!this.parseDate(this.selectedDate, selectedDateToken)){
        this.selectedDate.setTime(Date.now());
    }
    
    //Get year and month values
    var sYear = this.selectedDate.getFullYear();
    var sMonth = this.selectedDate.getMonth();
    var sDate = this.selectedDate.getDate();
    
    var cYear = this.currentDate.getFullYear();
    var cMonth = this.currentDate.getMonth();
    var cDate = this.currentDate.getDate();
    
    //If panel not exists create one
    var calendarPanel = this.getCalendarPanel(sYear, sMonth, datePicker);
    
    //Update calendar panel
    calendarPanel.update(datePicker, sYear, sMonth, sDate, cYear, cMonth, cDate);
    this.controlsTitle.innerHTML = sYear + ', ' + (sMonth + 1);
    
    return calendarPanel;
    
};

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.getPreviousPanel = function(calendarPanel) {
    this.selectedDate.setFullYear(calendarPanel.year);
    this.selectedDate.setMonth(calendarPanel.month);
    this.selectedDate.setDate(1);
    this.selectedDate.setMonth(calendarPanel.month-1);
    var previousPanel = this.getCalendarPanel(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), calendarPanel.datePicker);
    previousPanel.setDatePicker(calendarPanel.datePicker);
    return previousPanel;
};

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.getNextPanel = function(calendarPanel) {
    this.selectedDate.setFullYear(calendarPanel.year);
    this.selectedDate.setMonth(calendarPanel.month);
    this.selectedDate.setDate(1);
    this.selectedDate.setMonth(calendarPanel.month+1);
    var nextPanel = this.getCalendarPanel(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), calendarPanel.datePicker);
    nextPanel.setDatePicker(calendarPanel.datePicker);
    return nextPanel;
};

/**
 * 
 */
silverbullet.views.CalendarPool.prototype.render = function() {
    //Preparing controls panel
    var that = this;
    var controlsPanel = document.createElement('div');
    controlsPanel.style.paddingBottom = '20px';
    controlsPanel.style.textAlign = 'right';
    
        //Adding title
        this.controlsTitle = document.createElement('p');
        this.controlsTitle.style.display = 'inline';
        this.controlsTitle.style.paddingRight = '40px';

    controlsPanel.appendChild(this.controlsTitle);
    
        //Adding buttons
        var previousButton = document.createElement('button')
        previousButton.setAttribute('type', 'button');
        previousButton.innerHTML = '<';
        previousButton.addEventListener('click', function() {
            that.calendarPanel.datePicker.loadPreviousPanel();
        });
        previousButton.addEventListener('blur', function() {
            if(that.isMouseOut()){
                that.calendarPanel.datePicker.hidePopup();
            }
        });
        controlsPanel.appendChild(previousButton);
        
        var currentButton = document.createElement('button')
        currentButton.setAttribute('type', 'button');
        currentButton.innerHTML = '●';
        currentButton.addEventListener('click', function() {
            that.calendarPanel.datePicker.loadCurrentPanel();
        });
        currentButton.addEventListener('blur', function() {
            if(that.isMouseOut()){
                that.calendarPanel.datePicker.hidePopup();
            }
        });
        controlsPanel.appendChild(currentButton);
        
        var nextButton = document.createElement('button')
        nextButton.setAttribute('type', 'button');
        nextButton.innerHTML = '>';
        nextButton.addEventListener('click', function() {
            that.calendarPanel.datePicker.loadNextPanel();
        });
        nextButton.addEventListener('blur', function() {
            if(that.isMouseOut()){
                that.calendarPanel.datePicker.hidePopup();
            }
        });
        controlsPanel.appendChild(nextButton);


    this.element.appendChild(controlsPanel);
    
    this.element.addEventListener('mouseover', function() {
        that.mouseOverState = true;
    });
    this.element.addEventListener('mouseout', function() {
        that.mouseOverState = false;
    });
    this.element.addEventListener('blur', function() {
        if(that.isMouseOut()){
            that.calendarPanel.datePicker.hidePopup();
        }
    });


};

/**
 * Handles popup messages
 * 
 * @constructor
 */
silverbullet.views.PopupMessage = function (element, isDisposable = true) {
    silverbullet.views.ViewElement.call(this, element);
    this.isDisposable = isDisposable;
    this.redirectButtons = document.getElementsByClassName(element.id + '-redirect');
    this.closeButtons = document.getElementsByClassName(element.id + '-close');
};
silverbullet.views.PopupMessage.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.PopupMessage.prototype.constructor = silverbullet.views.PopupMessage;
silverbullet.views.PopupMessage.ELEMENT_CLASS = 'sb-popup-message';

/**
 * 
 */
silverbullet.views.PopupMessage.prototype.close = function () {
    this.element.parentNode.removeChild(this.element);
};

/**
 * 
 */
silverbullet.views.PopupMessage.prototype.hide = function () {
    this.element.style.display = 'none';
};

/**
 * 
 */
silverbullet.views.PopupMessage.prototype.positionToCenter = function () {
    if(this.element.children.length > 0){
        var msgbox = this.element.children[1];
        if(msgbox.children.length > 0){
            var msglayout = msgbox.children[0];
            if(msglayout.children.length > 0){
                var graybox = msglayout.children[0];
                var top = window.innerHeight/2 - graybox.offsetHeight/2;
                msglayout.style.top = top + 'px';
                graybox.style.top = top + 'px';
            }
        }
    }
};

/**
 * 
 */
silverbullet.views.PopupMessage.prototype.render = function () {
    var that = this;
    
    this.positionToCenter();
    
    for(var i=0; i<this.closeButtons.length; i++){
        this.closeButtons[i].addEventListener('click', function () {
            if(that.isDisposable){
                that.close();
            }else{
                that.hide();
            }
        });
    }
    
    for(var j=0; j<this.redirectButtons.length; j++){
        this.redirectButtons[j].addEventListener('click', function () {
            that.close();
            var currentLocation = window.location.toString();
            window.location = currentLocation.replace("edit_silverbullet.php", "overview_idp.php");
        });
    }
    
    window.addEventListener('resize', function() {
        that.positionToCenter();
    })
    
};

/**
 * Finds and enables all invitation token input elements that need copy to clipboard and compose mail features.
 * 
 * @constructor
 */
silverbullet.views.TokenProvider = function (element, panel) {
    silverbullet.views.ViewElement.call(this, element);
    this.copyInput = $(this.element);
    this.element = this.copyInput.parent();
    this.copyButton = null;
    this.composeButton = null;
    this.panel = panel;
    if(this.element){
        var query = '.' + silverbullet.views.TokenProvider.ELEMENT_CLASS;
        this.copyButton = this.element.find(query + '-copy');
        this.originalBackgroundColor = this.copyButton.css('background-color');
        this.originalColor = this.copyButton.css('color');
        this.composeButton = this.element.find(query+'-compose');
    }
};
silverbullet.views.TokenProvider.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.TokenProvider.prototype.constructor = silverbullet.views.TokenProvider;
silverbullet.views.TokenProvider.ELEMENT_CLASS = 'sb-invitation-token';

/**
 * 
 */
silverbullet.views.TokenProvider.prototype.animate = function () {
    this.copyButton.css('background-color', this.originalBackgroundColor);
    this.copyButton.css('color', this.originalColor);
    this.copyInput.blur();
};

/**
 * 
 */
silverbullet.views.TokenProvider.prototype.render = function () {
    var that = this;
    if(this.copyInput){
        this.copyButton.on('click', function() {
            that.copyButton.css('background-color', that.originalColor);
            that.copyButton.css('color', that.originalBackgroundColor);
            that.copyInput.select();
            document.execCommand("copy");
            setTimeout(function() {
                that.animate();
            }, 100);
        });
    }
    if(this.composeButton){
        this.composeButton.on('click', function() {
            that.panel.setInvitationLink(that.copyInput.val());
            that.panel.show();
        })
    }
};

/**
 * Generates compose email dialog panel. Panel needs to be wraped inside Popup Message.
 * 
 * @constructor
 */
silverbullet.views.ComposeEmailPanel = function (popup) {
    this.popup = popup;
    this.link = '';
    this.emailClientButton = null;
    this.emailCATButton = null;
    this.emailTextInput = null;
    this.containerElement = null;
    this.subject = '';
    this.body = '';
    this.tokenElement = document.createElement('input');
    this.tokenElement.setAttribute('type', 'hidden');
    this.tokenElement.setAttribute('name', 'tokenlink');
    this.errorElement = document.createElement('p');
    this.errorElement.style.color = "red";
    this.ajaxBusy = false;
    this.ajaxBuffer = null;
    if(this.popup){
        silverbullet.views.ViewElement.call(this, $(popup.element));
        var query = '#' + silverbullet.views.ComposeEmailPanel.ELEMENT_CLASS;
        this.emailClientButton = this.element.find(query + '-client');
        this.emailCATButton = this.element.find(query + '-cat');
        this.emailTextInput = this.element.find(query + '-email');
        this.containerElement = this.emailClientButton.parent();
    }
};
silverbullet.views.ComposeEmailPanel.prototype = Object.create(silverbullet.views.ViewElement.prototype);
silverbullet.views.ComposeEmailPanel.prototype.constructor = silverbullet.views.ComposeEmailPanel;
silverbullet.views.ComposeEmailPanel.ELEMENT_CLASS = 'sb-compose-email';
silverbullet.views.ComposeEmailPanel.COMMAND_VALIDATE_EMAIL = 'validateemailaddress';
silverbullet.views.ComposeEmailPanel.COMMAND_GET_DETAILS = 'gettokenemaildetails';

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.setInvitationLink = function (link) {
    this.link = link;
};

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.show = function () {
    var that = this;
    this.init();
    this.element.css('display',"block");
    this.emailTextInput.val('');
    this.popup.positionToCenter();
    
    that.tokenElement.setAttribute('value', that.link);
    if(that.containerElement.find(that.tokenElement).length==0){
        that.containerElement.append(that.tokenElement);
    }
    $.ajax({
        method: "POST",
        url: "inc/silverbullet.inc.php",
        data: {command: silverbullet.views.ComposeEmailPanel.COMMAND_GET_DETAILS, tokenlink: that.link}
    }).done(function(data) {
        var email = $(data).find('email');
        that.subject = email.attr('subject');
        that.body = email.text();
    }).fail(function() {
        that.errorElement.textContent = "Failed to compose message body and subject!";
    });
};

/**
 * @param {String} text
 * @param {String} color
 */
silverbullet.views.ComposeEmailPanel.prototype.showMessage = function (text, color) {
    this.errorElement.style.color = color;
    this.errorElement.textContent = text;
    if(!this.errorElement.parentNode){
        this.containerElement.append(this.errorElement);
    }
};

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.init = function (){
    this.ajaxBusy = false;
    if(this.errorElement.parentNode){
        this.errorElement.parentNode.removeChild(this.errorElement);
    }
    this.emailTextInput.prop('disabled', false);
    this.emailCATButton.prop('disabled', true);
};

/**
 * @param {silverbullet.views.EmailValidationCommand} command
 */
silverbullet.views.ComposeEmailPanel.prototype.repeat = function (command){
    this.ajaxBusy = false;
    this.emailTextInput.prop('disabled', false);
    this.emailCATButton.prop('disabled', true);
    this.cleanAjaxBuffer(command);
};

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.start = function (){
    this.ajaxBusy = true;
    this.emailTextInput.prop('disabled', false);
    this.emailCATButton.prop('disabled', true);
};

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.block = function (){
    this.ajaxBusy = true;
    this.emailTextInput.prop('disabled', true);
    this.emailCATButton.prop('disabled', true);
};

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.unblock = function (){
    this.ajaxBusy = true;
    this.emailTextInput.prop('disabled', false);
    this.emailTextInput.select();
    var length = this.emailTextInput.val().length;
    this.emailTextInput[0].selectionStart = length;
    this.emailTextInput[0].selectionEnd = length;
};

/**
 * @param {silverbullet.views.EmailValidationCommand} command
 */
silverbullet.views.ComposeEmailPanel.prototype.complete = function (command){
    this.ajaxBusy = false;
    if(this.errorElement.parentNode){
        this.errorElement.parentNode.removeChild(this.errorElement);
    }
    this.emailTextInput.prop('disabled', false);
    this.emailCATButton.prop('disabled', false);
    this.cleanAjaxBuffer(command);
};

/**
 * @param {silverbullet.views.EmailValidationCommand} command
 */
silverbullet.views.ComposeEmailPanel.prototype.cleanAjaxBuffer = function (command){
    if(this.ajaxBuffer){
        if(this.ajaxBuffer.address != command.address){
            var command = this.ajaxBuffer;
            this.ajaxBuffer = null;
            this.receive(command);
        }else{
            this.ajaxBuffer = null;
        }
    }
};

/**
 * 
 * @param {silverbullet.views.EmailValidationCommand} command
 */
silverbullet.views.ComposeEmailPanel.prototype.receive = function (command) {
    if(!this.ajaxBusy){
        command.execute();
    }else{
        this.ajaxBuffer = command;
    }
};

/**
 * 
 */
silverbullet.views.ComposeEmailPanel.prototype.render = function () {
    var that = this;
    this.popup.render();
    this.emailClientButton.on('click', function() {
        var mailto = "mailto:";
        var address = that.emailTextInput.val();
        if(address!=""){
            mailto += address;
        }
        if(that.subject && that.body){
            mailto += "?subject=" + that.subject + "&body=" + encodeURI(that.body);
        }
        window.location.href = mailto;
    });
    this.emailTextInput.on('keyup', function(e) {
        var address = that.emailTextInput.val();
        if(address.indexOf('@') > 0){
            if((e.which==8 || (e.which>45 && e.which<91) || (e.which>93 && e.which<112) || (e.which>185 && e.which<193) || (e.which>218 && e.which<223))){
                that.receive(new silverbullet.views.EmailValidationCommand(address, that));
            }
        }else{
            that.init();
        }    
    });
    this.emailTextInput.on('input', function() {
        var address = that.emailTextInput.val();
        if(address.indexOf('@') > 0){
            that.receive(new silverbullet.views.EmailValidationCommand(address, that));
        }else{
            that.init();
        }    
    });
    
    
};

/**
 * 
 * @constructor
 * @param {String} address
 * @param {silverbullet.views.ComposeEmailPanel} panel

 */
silverbullet.views.EmailValidationCommand = function (address, panel) {
    this.address = address;
    this.buttonElement = panel.emailCATButton;
    this.panel = panel;
    this.interval = -1;
    this.blocked = false;
};

/**
 * 
 */
silverbullet.views.EmailValidationCommand.prototype.clear = function(){
    if(this.interval > 0){
        clearInterval(this.interval);
        this.interval = -1;
        if(this.blocked){
            this.blocked = false;
            this.panel.unblock();
        }
    }
};

/**
 * 
 */
silverbullet.views.EmailValidationCommand.prototype.execute = function () {
    var that = this;
    this.panel.start();
    
    var validationMessage = "Validating email '" + this.address + "'";
    this.interval = setInterval(function() {
        that.panel.block();
        validationMessage += ".";
        that.panel.showMessage(validationMessage, 'green');
    }, 1000);
    
    $.ajax({
        method: "POST",
        url: "inc/silverbullet.inc.php",
        data: {command: silverbullet.views.ComposeEmailPanel.COMMAND_VALIDATE_EMAIL, address: encodeURI(that.address)}
    }).done(function(data) {
        that.clear();
        
        var email = $(data).find('email');
        var isValid = email.attr('isValid');
        var message = email.text();

        if(isValid=='true'){
            that.panel.complete(that);
            if(message.trim() == ''){
                that.panel.showMessage("The mail domain is valid and emails will be transmitted securely.", 'green');
            }
        }else{
            that.panel.repeat(that);
        }
        if(message.trim() != ''){
            that.panel.showMessage(message, 'red');
        }
        
    }).fail(function() {
        that.clear();
        that.panel.repeat(that);
        that.panel.showMessage("Failed to validate email address '" + that.address + "'!", 'red');
    });
    
};
