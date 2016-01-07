# flexible-scrollbar
A jQuery plugin for making highly configurable scrollbars.

####Simple usage
```javascript
//target is the html element that should be scrolled.
//scrollbar-container is the container for scrollbar (it can be placed anywhere on the page).
$('#scrollbar-container').scrollbar($('#target'));
```

####Bower installation
bower install flexible-scrollbar

For examples and more detailed explanation visit the [demo](http://ayeressian.github.io/flexible-scrollbar/) page.


###Limitations
Currently there is no browser DOM event for listening container (div) size changes. For resolving the issue there is an interval check for detecting container size changes, which consumes CPU cycles. One possible solution would be to get notified form user when container size changes. Usage of proxy pattern to resolve this issue is not possible since there are many use cases that can contribute to container size changes. There are some libraries which deal with this issue but I didn't had time to check those out (example http://meetselva.github.io/attrchange/).
