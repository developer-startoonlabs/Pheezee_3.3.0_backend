import numpy, sys, json
from scipy import signal
from numpy import diff
from scipy.signal import find_peaks
from scipy.signal import savgol_filter
peak =[]

activetime=sys.argv[1]
activetime_minutes = int(activetime[0:2])
activetime_seconds = int(activetime[5:7])
activetime = activetime_minutes*60 + activetime_seconds
reps = int(sys.argv[2])
download_time_stamp = sys.argv[5]


#Added try-execept handling in case Active time is 0.
try:
    velocity = activetime/reps
except:
    velocity = 0

contents = sys.argv[3]
if len(contents)>0:
    contents = contents.split(',')
    contents = list(map(float, contents))
    max = numpy.max(contents)
    indicator= numpy.zeros(len(contents))


    peak = signal.find_peaks(contents)[0]
    i=0
    while(i+1<len(peak)):
        if peak[i+1]-peak[i]<50:
            peak = numpy.delete(peak,i+1, None)
            i=i-1
        i=i+1

    maxima=[contents[peaks] for peaks in peak if contents[peaks]>0]

    #avgmax = numpy.mean(maxima)

    avg = numpy.mean(contents)
else:
    avg = 0
    avgmax = 0


#isokinetic
fs=50
contentsEmg = sys.argv[4]
test_list_emg=[]
if len(contentsEmg) > 0:
    contentsEmg = contentsEmg.split(',')
    contentsEmg = list(map(float, contentsEmg))
    arr_emg = numpy.array(contentsEmg)
    test_list_emg = numpy.zeros(len(arr_emg))

    for i in range(0, len(arr_emg)):
        test_list_emg[i] = int(contentsEmg[i]) 

    indicatorEmg= numpy.zeros(len(contentsEmg))
    flagEmg =0
    contractionsEmg=0
    rest_meanEmg = 6
    restslope_meanEmg = 0
    restslope_varianceEmg=3
    ontimeEmg=[]
    offtimeEmg = []
    startindexEmg=0
    endindexEmg=0
    topeakEmg = []
    frompeakEmg = []


    i=0
    j=0
    cpeak=0;

    while((i+2)<len(contentsEmg)):
        if(flagEmg==0 and contentsEmg[i+1]-contentsEmg[i]>(restslope_meanEmg+restslope_varianceEmg)):#Check if current slope is greater than ideal behaviour
            if (contentsEmg[i+2]-contentsEmg[i+1]>=contentsEmg[i+1]-contentsEmg[i]): # look ahead if the next slope is also greater
                startindexEmg=i
                flagEmg=1
                indicatorEmg[i:]=max
                if (endindexEmg!=0):
                    offtimeEmg.append((startindexEmg - endindexEmg)/fs)#update offtime
        if(flagEmg==1 and numpy.sign(contentsEmg[i]-contentsEmg[i-1])>numpy.sign(contentsEmg[i+1]-contentsEmg[i])): #identify the peak as the point where there is a change in the sign of the slope
                cpeak = i
                topeakEmg.append((cpeak-startindexEmg)/fs)#update time taken to reach the peak
        if(flagEmg==1 and contentsEmg[i+1]-contentsEmg[i]<(restslope_meanEmg+restslope_varianceEmg)):#check of current slope is rane of ideal behaviour
            if ((restslope_meanEmg-restslope_varianceEmg)<= contentsEmg[i+2]-contentsEmg[i+1] <=(restslope_meanEmg+restslope_varianceEmg)):# check if the next value is also in the ideal behaviour range
                flagEmg=0
                contractionsEmg += 1
                endindexEmg = i
                ontimeEmg.append((endindexEmg - startindexEmg)/fs)#update ontime
                frompeakEmg.append((endindexEmg-cpeak)/fs)# update time taken from the peak
                indicatorEmg[i:]=rest_meanEmg
                j=j+1

        i=i+1


    offtimeEmg.append(((i+1)-endindexEmg)/fs)
    avgontime = numpy.mean(ontimeEmg)
    avgofftime = numpy.mean(offtimeEmg)

    peakEmg = signal.find_peaks(contentsEmg,distance=200)[0]
    maximaEmg=[contentsEmg[peaks] for peaks in peakEmg if contentsEmg[peaks]>0]

    avg_emg_max_list=[]
    if len(peakEmg) > 1:
        for i in range(0, len(peakEmg)):
            avg_emg_max_list.append(test_list_emg[peakEmg[i]])

    avgmaxEmg = numpy.mean(avg_emg_max_list)

    avgtopeak = numpy.mean(topeakEmg)
    avgfrompeak = numpy.mean(frompeakEmg)

else:
    avgmaxEmg = 0
    contractionsEmg = 0

if numpy.isnan(avg): 
    avg=0
if numpy.isnan(avgmaxEmg): 
    avgmaxEmg=0
if numpy.isnan(contractionsEmg): 
    contractionsEmg=0


#ROM Contents


#Consistency
consistency = 0
inconsistency_count=0
inconsistency_count_min=0
arr = numpy.array(contents)
test_list = numpy.zeros(len(arr))

for i in range(0, len(arr)): 
    test_list[i] = int(arr[i]) 

test_list_negative=test_list*-1
peak = signal.find_peaks(test_list,distance=50)[0]
peak_minia = signal.find_peaks(test_list_negative,distance=100)[0]




#Smoothness
consistency = 0
inconsistency_count=0
inconsistency_count_min=0

arr = numpy.array(contents)
test_list = numpy.zeros(len(arr))
diff_list = numpy.zeros(len(arr))
new_list = numpy.zeros(len(arr))
up_flag=False;
down_flag= False;

for i in range(0, len(arr)): 
    test_list[i] = int(arr[i]) 

for i in range(1, len(arr)):
    diff_list[i] = int(arr[i])-int(arr[i-1])

for i in range(1, len(arr)-5):
    if(diff_list[i]>=0):
        if(diff_list[i+1]<0 or diff_list[i+2]<0 or diff_list[i+3]<0 or diff_list[i+4]<0 or diff_list[i+5]<0):
            up_flag = True;
            
    if(diff_list[i]<=0):
        if(diff_list[i+1]>0 or diff_list[i+2]>0 or diff_list[i+3]>0 or diff_list[i+4]>0 or diff_list[i+5]>0):
            down_flag = True;

            if(up_flag and down_flag):
                up_flag=False;
                down_flag=False;
                new_list[i]=200;
            

test_list_negative=test_list*-1
peak = signal.find_peaks(test_list,distance=50)[0]
peak_minima = signal.find_peaks(test_list_negative,distance=50)[0]


avg_rom_max_list=[]
avg_rom_min_list=[]

if len(peak) > 1:
    for i in range(0, len(peak)):
        avg_rom_max_list.append(test_list[peak[i]])


if len(peak_minia) > 1:
    for i in range(0, len(peak_minia)):
        avg_rom_min_list.append(test_list[peak_minia[i]])

if len(avg_rom_max_list) > 1:
    rom_avg_max = numpy.average(avg_rom_max_list)
else:
    rom_avg_max = numpy.max(test_list)

if len(avg_rom_min_list) > 1:
    rom_avg_min = numpy.average(avg_rom_min_list)
else:
    rom_avg_min = numpy.min(test_list)

test_list_negative=test_list*-1
peak = signal.find_peaks(test_list,distance=100,height = rom_avg_max)[0]
peak_minima = signal.find_peaks(test_list_negative,distance=100)[0]
results_half = signal.peak_widths(test_list_negative, peak_minima, rel_height=0.5)
results_full = signal.peak_widths(test_list_negative, peak_minima, rel_height=1)

results_half_maxima = signal.peak_widths(test_list, peak, rel_height=0.5)

if(numpy.average(results_half_maxima[0]) > 100):
    peak = signal.find_peaks(test_list,height=numpy.max(test_list)-(.75*(numpy.max(test_list)-numpy.min(test_list))),distance=numpy.average(results_half_maxima[0]))[0]
    peak_minima = signal.find_peaks(test_list_negative,height=-(numpy.min(test_list)+(.5*(numpy.max(test_list)-numpy.min(test_list)))),distance=numpy.average(results_half[0]))[0]

list_del=[]
for i in range(0,len(peak)):
    for j in range(0,len(peak_minima)):
        if(abs(peak_minima[j]-peak[i]) < 50):
            list_del.append(j)
peak_minima=numpy.delete(peak_minima,list_del)

avg_rom_max_list1=[]
avg_rom_min_list1=[]

if len(peak) > 1:
    for i in range(0, len(peak)):
        avg_rom_max_list1.append(test_list[peak[i]])


if len(peak_minima) > 1:
    for i in range(0, len(peak_minima)):
        avg_rom_min_list1.append(test_list[peak_minima[i]])

if len(avg_rom_max_list1) > 1:
    rom_avg_max = numpy.average(avg_rom_max_list1)
elif len(avg_rom_max_list) > 1:
    rom_avg_max = numpy.average(avg_rom_max_list)
else:
    rom_avg_max = numpy.max(test_list)

if len(avg_rom_min_list1) > 1:
    rom_avg_min = numpy.average(avg_rom_min_list1)
elif len(avg_rom_min_list) > 1:
    rom_avg_min = numpy.average(avg_rom_min_list)
else:
    rom_avg_min = numpy.min(test_list)


lower_slope = []
upper_slope= []
rating_controlled=0
min_len = min(len(peak_minima),len(peak))
try:
    if min_len > 1:
        #First peak is Maxima
        if peak[0] < peak_minima[0]:
            peak = numpy.delete(peak,0)
            for i in range(0,min_len-1):
                upper_slope.append(peak[i]-peak_minima[i])
                lower_slope.append(peak_minima[i+1]-peak[i])
        else:
            for i in range(0,min_len-1):
                upper_slope.append(peak[i]-peak_minima[i])
                lower_slope.append(peak_minima[i+1]-peak[i])
    else:
        rating_controlled = 0;        
except:
    rating_controlled = 0;

# Calculating the rating

for i in range(0,len(upper_slope)):
               rating_controlled=rating_controlled+(5-((numpy.abs(upper_slope[i]-lower_slope[i])/upper_slope[i])*5))
try:
    rating_controlled = rating_controlled/len(upper_slope)
except:
    rating_controlled =0        
                   

    


dx = 0.02
dy = diff(test_list)/dx

smoothness=[];
flag_down=False
flag_up = False
for i in range(10, len(dy),10):
    if(dy[i] > 0 or dy[i-1] > 0 or dy[i-2] > 0 or dy[i-3] > 0 or dy[i-4] > 0 or dy[i-5] > 0 or dy[i-6] > 0 or dy[i-7] > 0 or dy[i-8] > 0 or dy[i-9] > 0 or dy[i-10] > 0):
        flag_up = True;

    if(dy[i] < 0 or dy[i-1] < 0 or dy[i-2] < 0 or dy[i-3] < 0 or dy[i-4] < 0 or dy[i-5] < 0 or dy[i-6] < 0 or dy[i-7] < 0 or dy[i-8] < 0 or dy[i-9] < 0 or dy[i-10] < 0):
        flag_down = True;

    if(flag_up==True and flag_down==True):
        flag_up=False;
        flag_down=False;
        smoothness.append(False);
    else:
        smoothness.append(True);


#
roughness = numpy.count_nonzero(smoothness);
try:
    rating_smoothness = round(roughness/len(smoothness)*5);
except:
    rating_smoothness = 0;
    
    

#Check for Consistency in Maxima range old way
for i in range(0,len(peak)-1):
    if(numpy.abs(test_list[peak[i]]-test_list[peak[i+1]]) > 10):
        
        inconsistency_count=inconsistency_count+1
        text = 'Consistency'
    else:
        consistency =1
        text = 'Consistency'

#Check for Consistency in Minima range old way
for i in range(0,len(peak_minia)-1):
    if(numpy.abs(test_list[peak_minia[i]]-test_list[peak_minia[i+1]]) > 10):
        inconsistency_count_min=inconsistency_count_min+1
    else:
        consistency =1

try:
    rating = 5-((inconsistency_count/len(peak))*5)
except:
    rating = 0

try:
    rating_min = 5-((inconsistency_count_min/len(peak_minia))*5)
except:
    rating = 0

try:
    avg_rating = (rating+rating_min)/2
except:
    avg_rating=0




#if numpy.average(results_half_maxima[0])<66:
#    avg_rating=0
#    rating_smoothness=0
#    rating_controlled=0

if numpy.isnan(rom_avg_max): 
    rom_avg_max=0

if numpy.isnan(rom_avg_min): 
    rom_avg_min=0

range_gained = numpy.max(test_list)-numpy.min(test_list)

if(range_gained) > 360:
    range_gained=360
 
#consistency":avg_rating    
    


############################################  Written by Ayush see documentation of Co-ordination_V1.3.py

"""
Title:This is script to calculate the co_ordination and consistancy
Author:Ayush gupta
Date:23-08-2022
To:Startoonlabs

#############Versionlog##########

version            Date of modification                Modification done        line Number        Modifier
1
1.4                    05-09-2022                      Error handeling                             Ayush
################END#################### 

^^^^^^^^^^^^^^^^Readme^^^^^^^^^^^^^^^
1)This Script should be present in the folder containing emg and corresponding rom.txt file
2)Always read readme files and comments associated with code so do the same for this code also
3)Don't change the folder structure
4)Lines marked with ** should be commented whilw integration with server
^^^^^^^^^^^^^^^ReadmeEnd^^^^^^^^^^^^^^^^^^^^^

*******************Further improvement*****************
More robust minima finding technique can be used
More better formulae can be used for cordination...may be speed can be determined
*******************Further improvement*****************


"""    
def chota(a,b):
    if(a>b):
        return b
    else:
        return a    
def maxposition(A):  # Function to find minimum and maximum position in list
   max_idx = A.index(numpy.max(A)) 
   return max_idx                        #returns index of maximum found 
#Function to find local minima for ROM
#To be strictly called for ROM 
def local_minima_rom(EMG):#Emg is a list of ROM Ignore it
 ################### Savitzky goley filter on the ROM data ################## 
  try:
      yhat = savgol_filter(EMG, 50, 5)       # yhat is smoothened signal by savitzky goley filter 
  except:
      yhat = EMG 
  nyhat=numpy.array(yhat)                   #converting yhat to numpy array to find peaks
  #plt.plot(timescale, yhat,"g") 
 ################### Savitzky goley filter on the ROM data END##################  
  N=len(EMG) 
  peaks, _ = find_peaks(nyhat)          # returns an array of index of local minima as Rom passed to this function is flipped
  list_peaks = peaks.tolist()           #convert peaks array to list   
  Min_lpE=[]                            #init list which contains max_values...locally to function
  Min_lpt=[]                            #init list which contains time co-ordinate max_values.locally to function
  Sum=0                                 #for calculatu=ing average hieght of peaks...ie minimum
  i_shifted_array=[]                    #initialization of a list that contains shifted value of peaks 
  for spikes in list_peaks:             #average value of all peaks found  
       Sum=EMG[spikes]+Sum             
  try:     
      middle=(Sum)/len(list_peaks)              #average value of all peaks found
  except:
      middle=0      
                                       
  for i in list_peaks:
        if(EMG[i]>(middle)):            # only processing those MAximum which are greater than average of maximum values.
            while(((EMG[i]<EMG[i+1])&(EMG[i]>EMG[i-1]))!=0):  # search for the peaks nearby if found update the index of it
                if (EMG[i+1]>EMG[i]):
                    i=i+1
                    if (i+1>N-1):
                        break
                elif (EMG[i-1]>EMG[i]):   
                    i=i-1  
            Slice_range=25                                #check for the peaks .5 seconds back and forward to current peak and shift the peak index      
            if (i<Slice_range):                           #Slicing for starting of boundary conditions.
                List_slice=EMG[i-i:i+Slice_range]
                Index_arround=maxposition(List_slice)    # Shifting the index to nearby maximum value 
                i_shift=Index_arround                    # Shifting the index to nearby maximum value
            elif (i+Slice_range>N):                       
                List_slice=EMG[i-Slice_range:N]
                Index_arround=maxposition(List_slice)    #finding the max value in slice i.e minima local
                i_shift=(i-Slice_range)+Index_arround    # Shifting the index to nearby maximum value
            else:
                List_slice=EMG[i-Slice_range:i+Slice_range]  #Slicing for starting of boundary conditions.
                Index_arround=maxposition(List_slice)        # Shifting the index to nearby maximum value
                i_shift=(i-Slice_range)+Index_arround-1
            
            
            i_shifted_array.append(i_shift)                  #updating shifted index of peaks

 #for filtering out minima that are lying within avrage width of maxima..ie that are too near...may be on same peak            
  consecutive_minima_width=[]                                # array to initialize to store consecutive width of maxima         
  for index in range(0,len(i_shifted_array)-1):
      consecutive_minima_width.append(i_shifted_array[index+1]-i_shifted_array[index]) # Appending consecutive width of maxima 
  
  consecutive_minima_width_average=numpy.mean(consecutive_minima_width) #calculating average width
  consecutive_minima_width_average=consecutive_minima_width_average-10 #provideing a bias to width
  flag=1                            #initialization of flag to come out of while loop
  index=0
  len_ishift=len(i_shifted_array)   #lenth of shifted array
  while((flag!=0) and index<len_ishift-1 ):        
      if((i_shifted_array[index+1]-i_shifted_array[index])>consecutive_minima_width_average): #if width is greater than average width...move ahead in array
          flag=1
          index=index+1
      else:
          if(EMG[i_shifted_array[index+1]]>EMG[i_shifted_array[index]]):#slection of maxima smaller  should be excluded
              i_shifted_array.pop(index)
              flag=1
          else:    
              i_shifted_array.pop(index+1)                          #slection of which maxima should be excluded
              flag=1     
          len_ishift=len(i_shifted_array)                           #update length of list to end while loop condition
  for index in range(0,len(i_shifted_array)):
      Min_lpE.append(-1*EMG[i_shifted_array[index]-1])                # storing the updated peak value in Min_lpE
      Min_lpt.append((i_shifted_array[index]-1)*.02)                    #storing the time in absolute time for each corresponding peak in Min_lpt

  return Min_lpE, Min_lpt,i_shifted_array   #returning Minimum ROM value ,absolute time for MInima,index of corresponding minima
#end function

#This function is same as above function  
#To be strictly called for EMG 
def local_minima(EMG):
################### Savitzky goley filter on the EMG data END ##################      
  try:
      yhat = savgol_filter(EMG, 50, 5)
  except:
      yhat = EMG
  nyhat=numpy.array(yhat) 
  #plt.plot(timescale, yhat)
################### Savitzky goley filter on the EMG data END ################## 
  N=len(EMG)
  peaks, _ = find_peaks(nyhat)          # returns an array of index of local maxima
  list_peaks = peaks.tolist()           #convert peaks array to list   
  Min_lpE=[]                            #init list which contains min_values locally 
  Min_lpt=[]                            #init list which contains time co-ordinate min_values locally
  Sum=0
  i_shifted_array=[]
  for spikes in list_peaks:             #average value of all peaks found  
       Sum=EMG[spikes]+Sum             
        
  try:     
      middle=(Sum)/len(list_peaks)              #average value of all peaks found
  except:
      middle=0
  
  for i in list_peaks:
        if(EMG[i]>(middle-10)):            # only processing those MAximum which are greater than average of maximum values.
            while(((EMG[i]<EMG[i+1])&(EMG[i]>EMG[i-1]))!=0):  # search for the peaks nearby
                if (EMG[i+1]>EMG[i]):
                    i=i+1
                    if (i+1>N-1):
                        break
                elif (EMG[i-1]>EMG[i]):   
                    i=i-1  
            Slice_range=25                                #check for the peaks .5 seconds back and forward to current peak and shift the peak index      
            if (i<Slice_range):                           #Slicing for starting of boundary conditions.
                List_slice=EMG[i-i:i+Slice_range]
                Index_arround=maxposition(List_slice) # Shifting the index to nearby maximum value 
                i_shift=Index_arround                    # Shifting the index to nearby maximum value
            elif (i+Slice_range>N):                       
                List_slice=EMG[i-Slice_range:N]
                Index_arround=maxposition(List_slice)
                i_shift=(i-Slice_range)+Index_arround
            else:
                List_slice=EMG[i-Slice_range:i+Slice_range]  #Slicing for starting of boundary conditions.
                Index_arround=maxposition(List_slice)
                i_shift=(i-Slice_range)+Index_arround-1
            
            i_shifted_array.append(i_shift)
            
  consecutive_minima_width=[]
  for index in range(0,len(i_shifted_array)-1):
      consecutive_minima_width.append(i_shifted_array[index+1]-i_shifted_array[index])
  
  consecutive_minima_width_average=numpy.mean(consecutive_minima_width)
  consecutive_minima_width_average=consecutive_minima_width_average-10
  index=0
  len_ishift=len(i_shifted_array)
  while(index<len_ishift-1 ):        
      if((i_shifted_array[index+1]-i_shifted_array[index])>consecutive_minima_width_average):
        index=index+1
     
      else:
        if(EMG[i_shifted_array[index+1]]>EMG[i_shifted_array[index]]):
            i_shifted_array.pop(index)
        else:    
            i_shifted_array.pop(index+1)  
        len_ishift=len(i_shifted_array)
          
  for index in range(0,len(i_shifted_array)):
      Min_lpE.append(-1*EMG[i_shifted_array[index]-1])                #storing the updated peak value in MAX_lpe
      Min_lpt.append((i_shifted_array[index]-1)*.02)

  return Min_lpE, Min_lpt,i_shifted_array                           #returning Minimum EMG value ,absolute time for MInima,index of corresponding minima
#end function
####################### Function to find consistency
def consist(Max_lpE):
    if (len(Max_lpE)>1):
        if (Max_lpE.count(Max_lpE[1])>1):
            c=0
            Emg_disconnected_flag=1
        else:    
            c=0
            for i in range(0,len(Max_lpE)-1):
                if(abs(Max_lpE[i]-Max_lpE[i+1]) > Max_lpE[i]*.2):
                    c=c+0
                else:
                    c = 1+c
            c =int((c*5/len(Max_lpE))) 
            Emg_disconnected_flag=0
    else:
        Emg_disconnected_flag=1
        c=0 
    return c,Emg_disconnected_flag
####################### Function to find consistency END
def consist_cord(contents,contentsEmg):
##################### MAIN ##############################
###############  ENTRY of PROGRAM
    rom=contents
    Rom=[]                          # initialising a list for ROM values
    nrom=[]                         # initialising a list for fliping ROM values
    N = len(rom)                    # calculating the length of Rom data
    timescale=[]                    # Timescale axis initialization                           
    for m in range(0,N):
        nrom.append(-1*abs(int(rom[m])))     # changing string data to list of integers and fliping it to negative 
        timescale.append(float(m*.02))       # converting timescale values to seconds 
        Rom.append(abs(int(rom[m])))         # changing string data to list of integers and saving it ti list Rom
    
    Signal=contentsEmg                          #poping out first element since it contains index of row i.e  j
    N = len(Signal)                                  #calculating the length of Emg data
    EMG=[]                         # initialising a listfor EMG values
    nEMG=[]                        # initialising a list for fliping EMG values            
    for m in range(0,N):
        nEMG.append(-1*int(Signal[m]))     #changing string data to list of integers and flipping it 
        EMG.append(int(Signal[m]))         #changing string data to list of integers and saving it as original   
           

    ######################Finding Max Emg Values##########################

    #Naming convention of variables:
    #Min_lp,Max_lp=signifies  minima or maxima  local peak::: E,R signifies emg or rom and t signifies timesacle values   
    Min_lpE=[]                            #init list which contains max_values 
    Min_lpt=[]                            #init list which contains time co-ordinate min_values
    Max_lpE=[]                            #init list which contains max_values 
    Max_lpt=[]                            #init list which contains time co-ordinate max_values 
    i_shift_max=[]                        #index of local max
    i_shift_min=[]                        #index of local minimums 
    '''
    fig = plt.figure()
    plt.plot(timescale,EMG)               #plots the time scale and EMG values  
    plt.xlabel('Time(s)')
    plt.ylabel('EMG(uV)')    
    '''                
    Min_lpE, Min_lpt,i_shift_min= local_minima(nEMG)
    global_max=EMG.index(numpy.max(EMG))
    global_min=EMG.index(numpy.min(EMG))
    mean=(EMG[global_max]-EMG[global_min])/2    #calculating the half value of global maxima to global minima
    for i in range(0,len(i_shift_min)-1):
        Split=EMG[i_shift_min[i]:i_shift_min[i+1]]   #finding the max values between local minima
        try:
               max_value = numpy.max(Split)
        except:      
               max_value ="E"
               print("Error")
        if (max_value !="E") : 
            if (max_value>mean):                         #if it is greatrer than avg hieght consider it
                idx = Split.index(max_value)
                i_shift_max.append(idx+i_shift_min[i])
        
    for index in range(0,len(i_shift_max)):
        Max_lpE.append(EMG[i_shift_max[index]])                #storing the updated maxima value in MAX_lpe
        Max_lpt.append(i_shift_max[index]*.02)                 #storing the corresponding time value in MAX_lpt

    consistency_rating,Emg_disconnected_flag=consist(Max_lpE)                             #consistency_rating used in last line 
   
    '''
    plt.plot(Max_lpt,Max_lpE,"ro")                             #Plotting of max_min EMg values
    plt.plot(Min_lpt,Min_lpE,"bo")
    fig.set_size_inches(20.,10.)
    plt.savefig("EMG", dpi=100)
    plt.show()
    plt.clf()
    '''
    ######################Finding Max Emg Values END##########################        
        
    #################################Finding Max ROM Values  ########################      

    # See naming convention
    Min_lpR=[]                            #init list which contains min rom_values 
    Min_lpRt=[]                           #init list which contains corresponding time values min rom_values
    Max_lpR=[]                            #init list which contains max rom _values 
    Max_lpRt=[]                           #init list which contains time co-ordinate max rom_values 
    i_shift_max_rom=[]                    #index of max values
    i_shift_min_rom=[]                    #index of min values
    Min_lpR, Min_lpRt,i_shift_min_rom= local_minima_rom(nrom)
    
    global_max_Rom=numpy.max(Rom)
    global_min_Rom=numpy.min(Rom)
    #mean_Rom=(global_max_Rom-global_min_Rom)/2
    mean_Rom=global_max_Rom/2
    for i in range(0,len(i_shift_min_rom)-1):
        Split=Rom[i_shift_min_rom[i]:i_shift_min_rom[i+1]]
        try:
               max_value = numpy.max(Split)
        except:    
               max_value ="ERROR"
               print(max_value)
        if (max_value !="ERROR") :     
            if (max_value>mean_Rom):
                idx = Split.index(max_value)
                i_shift_max_rom.append(idx+i_shift_min_rom[i])
        
      
    for index in range(0,len(i_shift_max_rom)):
        Max_lpR.append(Rom[i_shift_max_rom[index]])                #storing the updated peak value in MAX_lpR
        Max_lpRt.append(i_shift_max_rom[index]*.02)   
    
    #print("Max_lpRt",Max_lpRt)  
    ''' 
    fig = plt.figure()     #Plotting of max_min Rom values
    plt.plot(timescale,Rom)
    plt.xlabel('Time(s)')
    plt.ylabel('Rom(Degree)') 
    plt.plot(Max_lpRt,Max_lpR,"go") 
    plt.plot(Min_lpRt,Min_lpR,"co")
    fig.set_size_inches(20.,10.)
    plt.savefig("ROM", dpi=100)
    '''
        
        
################################# Finding Max ROM Values END ########################     
        
    #For coordination
    #For coordination
    
    avg_width=[]      #Finding average width for coordination
    for index in range(0,len(Max_lpRt)-1):
        avg_width.append(Max_lpRt[index+1]-Max_lpRt[index])    
    
    gap=numpy.mean(avg_width)    
    avg_width=(numpy.mean(avg_width)/2) 
    cordination=0

    ##Checking which max value is alligned most 
    idx_r=0
    idx_e=0
    for i in range(0,len(Max_lpRt)):
        for j in range(0,len(Max_lpt)):
            if  (abs(Max_lpRt[i]- Max_lpt[j])<gap):
                gap=abs(Max_lpRt[i]- Max_lpt[j])
                idx_r=i
                idx_e=j   
           
    #shifting the arrays arrouund most aligned indexes and finding cordination           
    if (idx_r==idx_e):  
        a=chota(len(Max_lpt),len(Max_lpRt)) 
        for index in range(0,a):       
            if(abs(Max_lpRt[index]-Max_lpt[index])<avg_width):
                cordination=cordination+1
                #print(cordination)       
    elif (idx_r>idx_e):
        for k in range(0,abs(idx_r-idx_e)):
            Max_lpt.insert(0, 0)
        a=chota(len(Max_lpt),len(Max_lpRt)) 
        for index in range(0,a):
            if(abs(Max_lpRt[index]-Max_lpt[index])<avg_width):
                cordination=cordination+1             
    else:          
       for k in range(0,abs(idx_e-idx_r)):
           Max_lpRt.insert(0, 0)          
       a=chota(len(Max_lpt),len(Max_lpRt)) 
       for index in range(0,a):
           if(abs(Max_lpRt[index]-Max_lpt[index])<avg_width):
               cordination=cordination+1
                            
    if a==0:
       cordination=0       
    else: 
        if Emg_disconnected_flag==0:    
            cordination=(cordination/a)*5
            cordination=round(cordination) 
        else:
            cordination=0

    return consistency_rating,cordination                            #consistency_rating used in last line ,cordination   
      
###################################################### END Ayush program

if (len(contents)>1):
    try:
       consistency_rating,cordination=consist_cord(contents,contentsEmg) 
    except:
     consistency_rating,cordination=0,0
else:
    consistency_rating=0
    cordination=0


x = {"velocity":range_gained, "avg":round(avg,2), "avgmaxemg":round(avgmaxEmg,0),"contractions":contractionsEmg, "type_of":"ni","consistency":consistency_rating,"smoothness":rating_smoothness,"controlled":abs(rating_controlled),"download_time_stamp":download_time_stamp,"rom_avg_max":rom_avg_max,"rom_avg_min":rom_avg_min,"rom_max":numpy.max(test_list),"rom_min":numpy.min(test_list),"coordination": cordination}
y = json.dumps(x)
print(y)
