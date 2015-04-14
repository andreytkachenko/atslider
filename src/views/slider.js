/**
 * Created by tkachenko on 14.04.15.
 */

ATF.view('SliderView', ['jQuery', 'utils', '$template'],
    function ($, utils, $template) {
        var tpl = $template()
            .div({class: 'slider'})
                .div({class: 'slider-container', style: 'width: {{showingItems * itemWidth - 8}}px; height: {{itemWidth - 8}}px'})
                    .$On('scroll', 'setOffset($(this).scrollLeft() - width/2)')
                    .$SetProperty('scrollLeft', '{{ scrollLeft + width/2 }}')
                    .$On('touchstart', 'onTouchStart()')
                    .div({'class': 'slider-clip', 'style': 'height: {{itemWidth - 8}}px;width: {{showingItems * itemWidth - 8}}px'})
                        .ul({style: 'margin-left: -8px;width: {{width}}px;height:{{itemWidth}}px;'})
                            .each('item', 'items', 'index')
                                .$LightBox('{{ item.meta }}', '{{ data }}')
                                .li({class: '{{ data[item.meta].video ? "ts-video" : "" }}', style:'left:{{item.offset*itemWidth+width/2}}px;width:{{itemWidth}}px;height:{{itemWidth}}px;'})
                                    .div({class: 'image', style:'background-image:url({{data[item.meta].previewSrc}});'})
                                        .div({class:'info {{ data[item.meta].provider }}'})
                                            .img({class: 'profile-picture', src: '{{ data[item.meta].author.image }}'}).end()
                                            .div({class: 'author'}).text('{{ data[item.meta].author.name }}').end()
                                            .div({class: 'description'}).text('{{ data[item.meta].description }}').end()
                                        .end()
                                    .end()
                                .end()
                            .end()
                        .end()
                    .end()
                    .ul({'class': 'slider-controls'})
                        .$On('click', 'previous()')
                        .li({'class': 'prev'}).div({class:'noselect'}).text('Previous').end().end()
                        .$On('click', 'next()')
                        .li({'class': 'next'}).div({class:'noselect'}).text('Next');

        return function ($scope, $el) {
            document.body.appendChild(tpl.render($scope));
        }
    }
);
