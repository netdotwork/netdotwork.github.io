---
layout: page
title: categories
permalink: /categories/
---
<style type="text/css">
.tags {
	display: inline;
    padding: 0.2rem;
    margin-top: 0;
    margin-bottom: 0rem;
    overflow-x: auto;
    font: 0.8rem Consolas, "Liberation Mono", Menlo, Courier, monospace;
    color: #25292e;
    word-wrap: normal;
    background-color: #f6f8fa;
    border: solid 1px #dce6f0;
    border-radius: 0.3rem;
}
.tags a {
	color: #6c6c6d;
	border: 0;
}
.tags a:hover {
	color: #277cea;
	border: 0;
}
.links {
	text-decoration: none;	
	color: #000;	
	border: 0;	
}	
.links:hover, active, :focus {
	text-decoration: none;	
	color: #277cea;
	border: 0;	
}
h2 a.links:hover, active, :focus {
	text-decoration: none;	
	color: #000;
	border: 0;	
}
h3 {
	font-weight: normal;
}
</style>

<div>
{% for category in site.categories %}
  <div class="archive-group">
    {% capture category_name %}{{ category | first }}{% endcapture %}	
    <div id="#{{ category_name | slugize }}"></div>
    <p></p>
	<h2 class="category-head"><a class="links" name="{{ category_name | slugize }}">{{ category_name }}</a></h2>
    {% for post in site.categories[category_name] %}
    <article class="archive-item">
      <h3><a class="links" href="{{ site.baseurl }}{{ post.url }}"> {{post.title}}</a></h3>
	</article>
<div>
<code>tags: {% for tags in post.tags %}{% capture tag_name %}{{ tags }}{% endcapture %}<a href="{{site.baseurl}}/tags/#{{tag_name}}">{{ tag_name }}</a> {% endfor %}</code>
<p></p>
	</div>
    {% endfor %}
  </div>
{% endfor %}
</div>

<!--
Вывод всех используемых тегов:
<div>
<pre class="highlight">
<code><b>TAGS:</b></code>
{% for tag in site.tags %}{% capture tag_name %}{{ tag | first }}{% endcapture %}{{ tag_name }} {% endfor %}
</pre>
</div>
-->

<!--
Вывод постов, принадлежащих к тегам:
<h4 class="category-head"><a class="categories_links" name="servers">#servers:</a></h4>

{% for post in site.tags.servers %}
    <article class="archive-item">
      <h5><a href="{{ site.baseurl }}{{ post.url }}">{{post.title}}</a></h5>
    </article>
{% endfor %}

<h4 class="category-head"><a class="categories_links" name="cheatsheet">#cheatsheet:</a></h4>

{% for post in site.tags.cheatsheet %}
    <article class="archive-item">
      <h5><a href="{{ site.baseurl }}{{ post.url }}">{{post.title}}</a></h5>
    </article>
{% endfor %}
</div>
-->