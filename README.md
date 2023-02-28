# Tolerance Stackup Analysis Web App
Full-stack statistical tolerance stackup web application based on the Monte Carlo methodology, capable of analyzing 1D tolerance stackup chains. 

### Feature Demonstration

![1D Chain Video](https://raw.githubusercontent.com/slehmann1/Mechanitool/master/resources/SampleVideo.gif)

The software can also generate professional looking reports like [this (1D Stack)](https://github.com/slehmann1/Mechanitool/raw/master/resources/ToleranceStackupReport.pdf).

#### Dependencies and structure
Backend written in Python using Django, pandas, numpy, and scipy. A database is used to save tolerance stackups; this data is then served using a RESTful API.
Frontend written in Javascript with JQuery and bootstrap. D3.JS is used for plotting and both JSPDF and autotable for report generation. 