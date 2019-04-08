import 'jquery';
import 'popper.js';
import 'material-kit/core/bootstrap-material-design.min.js';
import 'material-kit/material-kit.js';
import 'angular';
import '@uirouter/angularjs';
import 'angular-sanitize';
import showdown from 'showdown';
import hljs from 'highlight.js/lib/highlight';
import xmlLanguage from 'highlight.js/lib/languages/xml';
import javascriptLanguage from 'highlight.js/lib/languages/javascript';
import typescriptLanguage from 'highlight.js/lib/languages/typescript';
import actionScriptLanguage from 'highlight.js/lib/languages/actionscript';
import bashLanguage from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('xml', xmlLanguage);
hljs.registerLanguage('javascript', javascriptLanguage);
hljs.registerLanguage('typescript', typescriptLanguage);
hljs.registerLanguage('actionscript', actionScriptLanguage);
hljs.registerLanguage('bash', bashLanguage);

// initialize app
const app = angular.module('docs', ['ngSanitize', 'ui.router']);

class WikiHomeController {
    constructor($element, $http, $state) {
        // get version
        const version = $state.params.version;
        $http.get(`../wiki/${version}/sidebar.md`).then( response => {
            if (response.status !== 200) {
                // throw error
                return;
            }
            const nav = $element.find('nav');
            const ul = $(new showdown.Converter().makeHtml(response.data));
            // add class for parent ul
            ul.addClass('list-unstyled components');
            // add class to child ul
            ul.find('ul').addClass('list-unstyled');
            // enumerate anchors
            ul.find('a').each((index, element) => {
                // get href attribute
                const href = $(element).attr('href');
                // build angular router link e.g. #!/wiki/2.3.0/Get-Started.md
                $(element).attr('href', `#!/wiki/${version}/${href}`);
                // check if anchor has a sub-menu
                const ul = $(element).closest('li').find('ul');
                // if ul exists then anchor has child menu
                if (ul.length) {
                    // add dropdown-toggle
                    $(element).addClass('dropdown-toggle');
                    // add collapse attribute(s)
                    $(element).attr('data-toggle', 'collapse');
                    $(element).attr('aria-expanded', 'false');
                    $(element).attr('aria-controls', `#submenu_${index}`);
                    // prevent default click (angular compatibility)
                    $(element).on('click', (ev) => {
                       return ev.preventDefault();
                    });
                    // add href to sub-menu
                    $(element).attr('href', `#submenu_${index}`);
                    // add sub-menu style
                    ul.addClass('list-unstyled collapse');
                    // add sub-menu id
                    ul.attr('id', `submenu_${index}`);
                    // call bootstrap directive
                    ul.collapse();
                }
            });
            // append elements
            nav.append(ul);
        });
    }
}
app.component('wikiHome', {
        template: `<div class="wrapper">
    <nav id="sidebar">
    </nav>
    <div class="container-fluid clearfix">
        <ui-view></ui-view>
    </div>
</div>`,
        controller: WikiHomeController,
        controllerAs: 'ctrl'
    });

class WikiPageViewController {
    constructor($element, $http, $state, $location) {
        const page = `..${$location.url()}`;
        $http.get(page).then( response => {
            if (response.status !== 200) {
                // throw error
                return;
            }
            const html = $(new showdown.Converter().makeHtml(response.data));
            html.find('code').addClass('hljs').each((index, codeElement) => {
                hljs.highlightBlock(codeElement);
            });
            $element.html(html);
        });
    }
}

app.component('wikiPage', {
    template: `<div></div>`,
    controller: WikiPageViewController,
    controllerAs: 'ctrl'
});

app.directive('btnSidebarToggler', function BtnSidebarToggler() {
    return {
        restrict: 'C',
        link: function link(scope, element) {
            $(element).on('click', ()=> {
                $('#sidebar').toggleClass('active');
            });
        }
    };
});

app.config(routeConfig);

function routeConfig($locationProvider, $stateProvider, $urlRouterProvider) {

    // router states
    $stateProvider.state({
        name: 'wikiHome',
        url: '/wiki/:version',
        component: 'wikiHome'
    }).state({
        name: 'page',
        parent: 'wikiHome',
        url: '/:page',
        component: 'wikiPage'
    }).state({
        name: 'childPage',
        parent: 'wikiHome',
        url: '/:page/:childPage',
        component: 'wikiPage'
    });
    $urlRouterProvider.otherwise(function($injector){
        //eslint-disable-next-line no-unused-vars
        const state = $injector.get('$state');
        return '/wiki/2.3.0/index.md';
    });
    $locationProvider.html5Mode(false);
}
