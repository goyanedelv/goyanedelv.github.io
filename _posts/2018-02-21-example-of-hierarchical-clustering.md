---
layout: post
title: "Example of Hierarchichal Clustering and String Distance"
author: "Gonzalo"
categories: sample
tags: [documentation,sample]
image: dendrogram.png
---


### A simple method for comparing the historical evolution of languages.

In 2015 I had the chance to travel through northern Europe, Russia, Mongolia, South Korea and Japan. During my trip one thing that’s caught my attention was the diverse of languages and the historical components that lead to the evolution of all those diverse ways of communication. I got aware of the linguistic theory and its classifications. German, English, Danish, Norwegian and Swedish all come from the Germanic line, a branch of the Indo-European languages. The Finnish and the Estonian are closely related languages and despite Finland and Estonia are in the same geographic region as Sweden and Norway, Finnish and Estonian came from a whole different branch not even related to Indo-European Languages: they come from the Uralic languages. During my visit to Russia I learnt the Cyrillic alphabet and understood the deep connections between the Slavic culture and how the Cyrillic was forged. Then after I got impressed how the Soviet Union introduced the Cyrillic alphabet in the Mongol language and how this resemblance the case in which the Arabs introduced the Arabic Alphabet to the Farsi (or Persian). Neither the Farsi and the Arabic nor the Russian and the Mongol are related languages, however it’s amazing to see how the historical forces play a key role by shaping the way we communicate. Anyways, after my long trip I became thoughtful regarding the historical evolution of languages and I took some tools from my background as a biochemist. Indeed, for comparing two related (or not-that-related) species, biological scientists use clustering algorithms based on the similarities or dissimilarities of genetic code. 

Inspired on the idea of bioinformatics, I assembled 100 common concepts based on what linguists call the Swadesh List. This list is set of concepts compiled for historical-comparative linguistics studies. It was named after the American linguist Morris Swadesh.

For 33 languages, I constructed a romanized transtliteration string of these 100 familiar words (this is a huge flaw of my design, I need international phonetics language but it’s to tedious to collect). For forcing alignment, I flanked by numbers 1 to 100 every word.

Thereafter, I tested some modified method of bioinformatics for computing the “distance” between every pair of strings. After a few tries, I finally chose a non-bioinformatics algorithm -but also useful for comparing strings—to compute the degree of dissimilarity: the Lenvenshtein Distance Algorithm.

<img src="{{ site.github.url }}/assets/img/levensh.png">

With this algorithm, I computed a 33x33 matrix in which I determined the “Levenshtein Distance” for every combination of languages. Then, I tested several clustering methods and compared which was the best fit to the actual historical and anthropological records. 

<img src="{{ site.github.url }}/assets/img/hierarchies.jpg">

My guess is that McQuitty methods does a wonderful job comparing to the actual evolution (for instance, [this concept map](https://upload.wikimedia.org/wikipedia/commons/4/4f/IndoEuropeanTree.svg) has also the exact same clusterizations for Indo-European Languages).

This is just my favourite dendrogram ;)

<img src="{{ site.github.url }}/assets/img/dendrogram.png">


### Do it by yourself!

[Here](https://goyanedelv.github.io/assets/documents/lingT.csv) you can find the databse of 100 concatenated words for 39 languages.

Try this code on R:
```R
	library(stringdist)

	data=read.csv("lingT.csv")
	data2=subset(data,Consider==1)

	dimens=length(data2$Consider)

	dist_matrix=matrix(, nrow = dimens, ncol = dimens)

	for (i in 1:dimens){#you can do this in the former line but I like loops <3
		for (j in 1:dimens){
			dist_matrix[i,j]=stringdist(data2[i,2],data2[j,2])
		}
	}

	colnames(dist_matrix)=data2$Lang

	Matriz_Idiomas=as.dist(dist_matrix)

	par(mfrow=c(2, 2))

	hc1 <- hclust(Matriz_Idiomas,method="mcquitty")#,members=data$Lang)
	hcp1=plot(hc1,main="Method: McQuitty",
		xlab=NULL,ylab="Distancia relativa",type = "unrooted",sub="")


	hc2 <- hclust(Matriz_Idiomas,method="average")#,members=data$Lang)
	hcp2=plot(hc2,main="Method: Average",
		xlab=NULL,ylab="Distancia relativa",type = "unrooted",sub="")


	hc3 <- hclust(Matriz_Idiomas,method="single")#,members=data$Lang)
	hcp3=plot(hc3,main="Method: Single",
		xlab=NULL,ylab="Distancia relativa",type = "unrooted",sub="")


	hc4 <- hclust(Matriz_Idiomas,method="complete")#,members=data$Lang)
	hcp4=plot(hc4,main="Method: Complete",
		xlab=NULL,ylab="Distancia relativa", sub="")

		library("ape")
colors = c("red", "blue", "green", "black","brown","steelblue","darkorange",
	"tomato","purple","gray")
clus4 = cutree(hc1, 10)#9)
pdf('ddg2.pdf')
plot(as.phylo(hc1), type = "fan", tip.color = colors[clus4],
     label.offset = 1, cex = 0.7)

```
