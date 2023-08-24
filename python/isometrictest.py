import numpy, sys, json
from scipy import signal

fs=50
contentsEmg = sys.argv[4]
if len(contentsEmg) > 0:
    contentsEmg = contentsEmg.split(',')
    contentsEmg = list(map(float, contentsEmg))
    indicator= numpy.zeros(len(contentsEmg))

    flag =0
    contractions=0
    ontime=[]
    offtime = []
    totaltime = len(contentsEmg)/fs
    startindex=0
    endindex=0

    rest_mean = 6
    rest_variance=3

    max = numpy.max(contentsEmg)

    i=20
    while((i+1)<len(contentsEmg)):
        if(flag==0 and contentsEmg[i]>(rest_mean+rest_variance)): #verify if the value is greater than ideal behaviour
            if (contentsEmg[i+1]>=contentsEmg[i]):#Look ahead for the next value and check if it greater
                startindex=i
                flag=1
                indicator[i:]=max #used to indicate ontime and offtime in the signal
                if (endindex!=0):
                    offtime.append((startindex - endindex)/fs)#update offtime if it's not the first time offtime is encountered
        if(flag==1 and contentsEmg[i]<(rest_mean+rest_variance)): # verify if the value is less than ideal behaviour
            if ((rest_mean-rest_variance)<= contentsEmg[i+1] <=(rest_mean+rest_variance)): # check ifthe next value lies in the range of the ideal behaviour
                flag=0
                contractions += 1
                endindex = i
                ontime.append((endindex - startindex)/fs) #update ontime
                indicator[i:]=rest_mean
        i=i+1

    offtime.append(((i+1)-endindex)/fs)
    avgontime = numpy.mean(ontime)
    avgofftime = numpy.mean(offtime)

#velocity = contractions/totaltime
    peak = signal.find_peaks(contentsEmg)[0]
#print(peak)
    maxima=[contentsEmg[peaks] for peaks in peak if contentsEmg[peaks]>0]

    avgmax = numpy.mean(maxima)

else:
    contractions = 0
    avgontime = 0
    avgofftime = 0
    avgmax = 0

if numpy.isnan(contractions): 
    contractions=0
if numpy.isnan(avgontime): 
    avgontime=0
if numpy.isnan(avgofftime): 
    avgofftime=0
if numpy.isnan(avgmax): 
    avgmax=0
    
x = {"contractions":contractions, "avgontime":round(avgontime,2), "avgofftime":round(avgofftime,2),"avgmaxemg":round(avgmax,2), "type_of":"ii"}
y = json.dumps(x)
print(y)